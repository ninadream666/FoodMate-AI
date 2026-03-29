# 开发指南

开发中遇到问题，可能再次出现或在对方那里出现，解决方案记在这里。以后要改README再说

## Backend

这里放后端，和原来的结构一样，正常开发，注意端口不要与前端用的冲突。

## Frontend

这里放前端，新的代码放在src下，原代码在src_frontend_web。改一部分就放一部分到src，然后测试，以免直接修改出现混乱。

- 前端配置问题：

1. Android Studio下载最新版即可，虚拟设备模拟器选择Pixel 7，API 34， Google play store。
2. 因自动初始化的框架无法正常连接，所以修改了android的部分配置，尽量不要修改。
3. 如果连接有问题，可创建android/local.properties，写上本地的Android\Sdk的路径。例如：

```bash
sdk.dir=C\:\\Users\\用户名\\AppData\\Local\\Android\\Sdk
```

- 前端测试方法：

1. VS Code控制台中打开终端，运行：npx react-native start --port 端口号
2. 打开新的终端（上一个不关），运行：npx react-native run-android --port 端口号
3. 如果出现问题（我跑通了，应该不会吧），可修改配置后，运行下列命令重试：

```bash
cd android
./gradlew clean
cd ..
```

- 前端使用的端口建议：8001~8082之间。因为后端微服务从8083开始往后加，延续之前的端口设置比较方便。

## git版本控制及其他建议

1. 每次开发前，拉取github上的新代码，合并后再修改。
2. 每次开发后，如果测试成功，就上传到各自分支并提pr，合并到main。
3. 建议开发完新功能就立即写前端测试。
4. 端口等具体的配置选择尽量新增或者修改靠后的内容，尽量不要修改已完成的部分。

## 真机连接测试

目录： C:\Users\用户名\AppData\Local\Android\Sdk\platform-tools
.\adb.exe pair <手机IP>:<端口号>
.\adb.exe connect <手机IP>:<端口号>

## 语音识别gguf模型文件初始化问题

文件：frontend\src\services\VoiceInferenceService.ts
文本位置：const downloadUrl = 'http://100.80.56.118:9099/models/model_1500_q8.gguf';
IP地址替换为电脑的局域网IP，并在backend/static下运行python -m http.server 9099

后续部署到服务器上另有方法。
