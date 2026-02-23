/**
 * VoiceInferenceService.ts - 离线语音与端侧大模型引擎
 * * 阶段一：使用 react-native-vosk 进行离线语音实时转文字（带智能思考静音检测）
 * * 阶段二：使用 llama.rn 加载端侧轻量级大模型（如 Qwen-0.5B），将文本提纯为 JSON 隐私约束
 * 绝对保护隐私，录音不出端。
 */

import Vosk from 'react-native-vosk';
import { initLlama, LlamaContext } from 'llama.rn';
import { PermissionsAndroid, Platform, NativeModules, DeviceEventEmitter, NativeEventEmitter } from 'react-native';
import RNFS from 'react-native-fs';

class VoiceInferenceService {
    private vosk: typeof Vosk | null = null;
    private llamaContext: LlamaContext | null = null;
    private isInitialized = false;

    // 状态控制
    private isRecording = false;
    private silenceTimer: NodeJS.Timeout | null = null;
    
    // 回调函数
    private onPartialCallback: ((text: string) => void) | null = null;
    private onCompleteCallback: ((text: string) => void) | null = null;
    
    // 文本累加与兜底
    private accumulatedText = "";
    private lastPartialText = ""; 

    /**
     * 初始化 Vosk 和 端侧 LLM
     */
    public async init() {
        if (this.isInitialized) return;

        // --- 1. 独立初始化 Vosk 语音引擎 ---
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

        // --- 2. 独立初始化 Llama 大模型引擎 ---
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log('🧠 [LLM] 准备加载端侧大模型...');

            const modelFileName = 'qwen2.5-0.5b-instruct-q4.gguf';
            const destPath = `${RNFS.DocumentDirectoryPath}/${modelFileName}`;
            const exists = await RNFS.exists(destPath);
            
            if (!exists) {
                console.log(`📦 [LLM] 初次运行：正在从 APK 安装包中释放大模型文件...`);
                await RNFS.copyFileAssets(modelFileName, destPath);
                console.log(`✅ [LLM] 模型释放完成，物理路径: ${destPath}`);
            }

            this.llamaContext = await initLlama({
                model: destPath,
                use_mlock: false, 
                use_mmap: true,  
                n_ctx: 512, 
            });
            console.log('✅ [LLM] 大模型加载完毕，随时待命！');
        } catch (error) {
            console.warn('⚠️ [LLM] 大模型初始化失败 (将降级使用基础语音服务):', error);
            this.llamaContext = null; 
        }

        // --- 3. 终极事件拦截网（全通道监听） ---
        this.setupBulletproofEventListeners();

        this.isInitialized = true;
        console.log('✅ [端云协同] 本地双引擎初始化流程结束！');
    }

    /**
     * 终极事件拦截网：同时监听所有可能的 React Native 底层通信通道
     */
    private setupBulletproofEventListeners() {
        const processPartial = (source: string, e: any) => {
            if (!this.isRecording) return;
            console.log(`📡 [事件拦截-${source}-Partial]:`, JSON.stringify(e));
            const text = this.extractVoskText(e);
            if (text.length > 0) {
                console.log(`🎯 [捕获有效文字-${source}]:`, text);
                this.lastPartialText = text; 
                this.resetSilenceTimer(2000); // 说话期间不断重置2秒倒计时
                if (this.onPartialCallback) this.onPartialCallback(text);
            }
        };

        const processFinal = (source: string, e: any) => {
            console.log(`📡 [事件拦截-${source}-Final]:`, JSON.stringify(e));
            const text = this.extractVoskText(e);
            if (text.length > 0) {
                this.accumulatedText += text + " ";
                this.lastPartialText = ""; 
            }
        };

        // 通道 1: NativeEventEmitter (新架构标准专属通道)
        if (NativeModules.Vosk) {
            const nativeEmitter = new NativeEventEmitter(NativeModules.Vosk);
            nativeEmitter.addListener('onPartialResult', (e) => processPartial('NativeEmitter', e));
            nativeEmitter.addListener('onResult', (e) => processFinal('NativeEmitter', e));
            nativeEmitter.addListener('onFinalResult', (e) => processFinal('NativeEmitter', e));
        }

        // 通道 2: DeviceEventEmitter (旧架构硬编码全局通道)
        DeviceEventEmitter.addListener('onPartialResult', (e) => processPartial('DeviceEmitter', e));
        DeviceEventEmitter.addListener('onResult', (e) => processFinal('DeviceEmitter', e));
        DeviceEventEmitter.addListener('onFinalResult', (e) => processFinal('DeviceEmitter', e));

        // 通道 3: Vosk 官方 JS 包装器内部通道
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
        console.log('🎤 [Vosk-底层原始数据-Stop返回值]:', JSON.stringify(stopResult));

        const extractedStopText = this.extractVoskText(stopResult);
        
        let finalText = this.accumulatedText.trim();
        if (!finalText && this.lastPartialText.trim()) {
            finalText = this.lastPartialText.trim();
        }
        if (!finalText && extractedStopText.length > 0) {
            finalText = extractedStopText;
        }
        
        console.log('🎤 [Vosk-结束] 最终识别结果:', `[${finalText}]`);

        if (this.onCompleteCallback) {
            this.onCompleteCallback(finalText);
        }
    }

    public async processIntent(text: string): Promise<string> {
        if (!this.llamaContext) {
            console.warn('⚠️ [LLM] 大模型未就绪或加载失败，使用兜底降级策略处理文本');
            return JSON.stringify({
                query: text,
                forbidden_ingredients: [],
                required_temperature: [],
                preferred_tags: [],
                max_price: null
            });
        }

        console.log('🧠 [LLM] 开始端侧意图提纯，原始文本:', text);

        const prompt = `<|im_start|>system
你是一个运行在手机端侧的外卖意图提取助手。
请提取用户的点餐需求，输出严格的JSON格式，不要输出其他任何字符。
【重要警告】：如果用户没有明确提到价格或特定的健康约束，对应字段必须为空数组 [] 或 null！绝不能照抄模板中的例子！

输出格式模板：
{
  "query": "提取的食物名或意图（如：吃火锅、喝奶茶）",
  "forbidden_ingredients": [], 
  "required_temperature": [],
  "preferred_tags": [],
  "max_price": null 
}
<|im_end|>
<|im_start|>user
文本内容：${text}
<|im_end|>
<|im_start|>assistant
{`;

        try {
            const result = await this.llamaContext.completion({
                prompt: prompt,
                n_predict: 150, 
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
            return jsonStr;

        } catch (error) {
            console.warn('⚠️ [LLM] 推理失败:', error);
            return "{}"; 
        }
    }
}

export const voiceInferenceService = new VoiceInferenceService();