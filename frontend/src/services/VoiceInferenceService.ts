/**
 * VoiceInferenceService.ts - 离线语音与端侧大模型引擎
 * 阶段一：使用react-native-vosk进行离线语音实时转文字
 * 阶段二：使用llama.rn加载微调后的端侧大模型，支持多轮对话的状态追踪(DST)
 * 绝对保护隐私，录音不出端。
 */

import Vosk from 'react-native-vosk';
import { initLlama, LlamaContext } from 'llama.rn';
import { PermissionsAndroid, Platform, NativeModules, DeviceEventEmitter, NativeEventEmitter } from 'react-native';
import RNFS from 'react-native-fs';

// 定义对话历史接口
interface DialogueMessage {
    role: 'user' | 'assistant';
    content: string;
}

class VoiceInferenceService {
    private vosk: typeof Vosk | null = null;
    private llamaContext: LlamaContext | null = null;
    public isInitialized = false;

    // 状态控制
    private isRecording = false;
    private silenceTimer: NodeJS.Timeout | null = null;
    
    // 多轮对话核心状态
    private dialogueHistory: DialogueMessage[] = [];
    
    // 训练时的精确System Prompt
    private readonly SYSTEM_PROMPT = "你是一个运行在手机端侧的外卖意图提取助手。请提取用户的点餐需求，输出严格的JSON格式。如果用户没有明确提到价格或特定的健康约束，对应字段必须为空数组 [] 或 null。";

    // 回调函数
    private onPartialCallback: ((text: string) => void) | null = null;
    private onCompleteCallback: ((text: string) => void) | null = null;
    
    // 文本累加与兜底
    private accumulatedText = "";
    private lastPartialText = ""; 

    /**
     * 初始化Vosk和端侧LLM
     */
    public async init(onProgress?: (progress: number) => void) {
        if (this.isInitialized) {
            if (onProgress) onProgress(100);
            return;
        }

        // --- 独立初始化Vosk语音引擎 ---
        try {
            console.log('🔍 [系统诊断] 当前已加载的原生模块列表:', Object.keys(NativeModules));
            this.vosk = Vosk || NativeModules.Vosk;

            if (!this.vosk) {
                console.error('❌ 底层原生模块彻底未加载，需要配置 Android 手动链接！');
                throw new Error("Vosk 原生模块丢失");
            }

            console.log('🎤 [Vosk] 正在加载离线语音模型...');
            await this.vosk.loadModel('vosk-model-small-cn'); 
            console.log('✅ [Vosk] 语音模型加载完毕');
        } catch (error) {
            console.error('❌ [Vosk] 初始化失败:', error);
            throw error; 
        }

        // --- 独立初始化Llama大模型引擎 ---
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log('🧠 [LLM] 准备加载微调后的端侧大模型...');

            const modelFileName = 'model_1500_q8.gguf';
            const destPath = `${RNFS.DocumentDirectoryPath}/${modelFileName}`;
            
            // 不仅检查是否存在，还要严查文件体积，防范0字节导致C++引擎崩溃
            const fileStat = await RNFS.stat(destPath).catch(() => null);
            const exists = fileStat !== null && fileStat.isFile();
            const minValidSize = 50 * 1024 * 1024;

            if (!exists || Number(fileStat.size) < minValidSize) {
                if (exists) {
                    console.log(`📦 [LLM] 警告：发现损坏或不完整的残缺模型 (${fileStat?.size} Bytes)，正在强制清理...`);
                    await RNFS.unlink(destPath).catch(() => {});
                }

                console.log(`📦 [LLM] 初次运行：正在通过 USB 物理隧道从电脑下载模型...`);
                const downloadUrl = 'http://127.0.0.1:9099/models/model_1500_q8.gguf';

                const downloadOptions = {
                    fromUrl: downloadUrl,
                    toFile: destPath,
                    progressDivider: 1, 
                    progress: (res: any) => {
                        const progressPercent = Math.round((res.bytesWritten / res.contentLength) * 100);
                        if (onProgress) onProgress(progressPercent);
                        console.log(`📦 [LLM] 下载进度: ${progressPercent}%`);
                    }
                };

                const downloadResult = await RNFS.downloadFile(downloadOptions).promise;
                if (downloadResult.statusCode === 200) {
                    console.log(`✅ [LLM] 模型下载完成，物理路径: ${destPath}`);
                    if (onProgress) onProgress(100);
                } else {
                    throw new Error(`模型下载失败，HTTP状态码: ${downloadResult.statusCode}`);
                }
            } else {
                if (onProgress) onProgress(100);
                console.log(`✅ [LLM] 检测到完整模型已存在沙盒中，体积: ${(Number(fileStat.size)/1024/1024).toFixed(2)}MB。直接加载!`);
            }

            this.llamaContext = await initLlama({
                model: destPath,
                use_mlock: false, 
                use_mmap: true,  
                n_ctx: 1024,
            });
            console.log('✅ [LLM] 大模型加载完毕，随时待命！');
        } catch (error) {
            console.warn('⚠️ [LLM] 大模型初始化/下载失败 (将降级使用基础语音服务):', error);
            this.llamaContext = null; 
            
            const destPath = `${RNFS.DocumentDirectoryPath}/model_1500_q8.gguf`;
            await RNFS.unlink(destPath).catch(() => {});
        }

        // --- 终极事件拦截网（全通道监听） ---
        this.setupBulletproofEventListeners();

        this.isInitialized = true;
        console.log('✅ [端云协同] 本地双引擎初始化流程结束！');
    }

    public clearSession() {
        this.dialogueHistory = [];
        console.log('🧹 [LLM] 多轮对话记忆已清空，开启全新点餐 Session。');
    }

    private setupBulletproofEventListeners() {
        const processPartial = (source: string, e: any) => {
            if (!this.isRecording) return;
            const text = this.extractVoskText(e);
            if (text.length > 0) {
                this.lastPartialText = text; 
                this.resetSilenceTimer(2000);
                if (this.onPartialCallback) this.onPartialCallback(text);
            }
        };

        const processFinal = (source: string, e: any) => {
            const text = this.extractVoskText(e);
            if (text.length > 0) {
                this.accumulatedText += text + " ";
                this.lastPartialText = ""; 
            }
        };

        if (NativeModules.Vosk) {
            const nativeEmitter = new NativeEventEmitter(NativeModules.Vosk);
            nativeEmitter.addListener('onPartialResult', (e) => processPartial('NativeEmitter', e));
            nativeEmitter.addListener('onResult', (e) => processFinal('NativeEmitter', e));
            nativeEmitter.addListener('onFinalResult', (e) => processFinal('NativeEmitter', e));
        }

        DeviceEventEmitter.addListener('onPartialResult', (e) => processPartial('DeviceEmitter', e));
        DeviceEventEmitter.addListener('onResult', (e) => processFinal('DeviceEmitter', e));
        DeviceEventEmitter.addListener('onFinalResult', (e) => processFinal('DeviceEmitter', e));

        if (this.vosk && typeof (this.vosk as any).onPartialResult === 'function') {
            (this.vosk as any).onPartialResult((e: any) => processPartial('Wrapper', e));
            (this.vosk as any).onResult((e: any) => processFinal('Wrapper', e));
        }
    }

    private resetSilenceTimer(delay: number) {
        if (this.silenceTimer) clearTimeout(this.silenceTimer);
        this.silenceTimer = setTimeout(() => {
            if (this.isRecording) {
                console.log('🎤 [Vosk] 检测到持续静音，自动结束录音...');
                this.stopListening();
            }
        }, delay);
    }

    private extractVoskText(e: any): string {
        if (!e) return "";
        let rawString = "";
        if (typeof e === 'string') rawString = e;
        else if (e.data && typeof e.data === 'string') rawString = e.data;
        else if (e.result && typeof e.result === 'string') rawString = e.result;
        else if (e.partial && typeof e.partial === 'string') rawString = e.partial;
        else return "";

        try {
            const jsonObj = JSON.parse(rawString);
            return (jsonObj.text || jsonObj.partial || jsonObj.result || "").trim();
        } catch (err) {
            return rawString.trim();
        }
    }

    public async startListening(
        onPartial: (text: string) => void,
        onComplete: (finalText: string) => void
    ) {
        if (!this.isInitialized || !this.vosk) throw new Error("引擎未初始化");

        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
            );
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                throw new Error("麦克风权限被拒绝");
            }
        }

        this.onPartialCallback = onPartial;
        this.onCompleteCallback = onComplete;
        this.accumulatedText = "";
        this.lastPartialText = "";
        this.isRecording = true;

        console.log('🎤 [Vosk] 开始录音，等待指令...');
        await this.vosk.start({}); 
        this.resetSilenceTimer(5000); 
    }

    public async stopListening() {
        if (!this.isRecording) return;
        this.isRecording = false;
        if (this.silenceTimer) clearTimeout(this.silenceTimer);

        const stopResult = await this.vosk?.stop();
        const extractedStopText = this.extractVoskText(stopResult);
        
        let finalText = this.accumulatedText.trim();
        if (!finalText && this.lastPartialText.trim()) finalText = this.lastPartialText.trim();
        if (!finalText && extractedStopText.length > 0) finalText = extractedStopText;
        
        console.log('🎤 [Vosk-结束] 最终识别结果:', `[${finalText}]`);

        if (this.onCompleteCallback) {
            this.onCompleteCallback(finalText);
        }
    }

    private buildMultiTurnPrompt(newText: string): string {
        let prompt = `<|im_start|>system\n${this.SYSTEM_PROMPT}\n<|im_end|>\n`;
        
        for (const msg of this.dialogueHistory) {
            prompt += `<|im_start|>${msg.role}\n${msg.content}\n<|im_end|>\n`;
        }
        
        prompt += `<|im_start|>user\n${newText}\n<|im_end|>\n<|im_start|>assistant\n{`;
        return prompt;
    }

    public async processIntent(text: string): Promise<string> {
        if (!this.llamaContext) {
            console.warn('⚠️ [LLM] 大模型未就绪，使用兜底逻辑');
            return JSON.stringify({ query: text, forbidden_ingredients: [], required_temperature: [], preferred_tags: [], max_price: null });
        }

        console.log(`🧠 [LLM] 端侧意图提纯 (第 ${this.dialogueHistory.length / 2 + 1} 轮)，原始文本:`, text);

        const prompt = this.buildMultiTurnPrompt(text);

        try {
            const result = await this.llamaContext.completion({
                prompt: prompt,
                n_predict: 200, 
                temperature: 0.1, 
            });

            let jsonStr = "{" + result.text;
            jsonStr = jsonStr.replace(/<\|im_end\|>/g, '').trim();
            const firstBrace = jsonStr.indexOf('{');
            const lastBrace = jsonStr.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
            }

            console.log('🛡️ [LLM] 端侧提纯结果:', jsonStr);

            this.dialogueHistory.push({ role: 'user', content: text });
            
            try {
                const parsedResult = JSON.parse(jsonStr);
                this.dialogueHistory.push({ role: 'assistant', content: JSON.stringify(parsedResult, null, 0) });
            } catch (e) {
                this.dialogueHistory.push({ role: 'assistant', content: jsonStr });
            }

            return jsonStr;

        } catch (error) {
            console.warn('⚠️ [LLM] 推理失败:', error);
            return "{}"; 
        }
    }
}

export const voiceInferenceService = new VoiceInferenceService();