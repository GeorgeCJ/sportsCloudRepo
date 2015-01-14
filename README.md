# LeanChat 服务端

## 简介

LeanChat 是 [LeanCloud](http://leancloud.cn) [实时通信](https://leancloud.cn/docs/realtime.html) 组件的 Demo，通过该应用你可以学习和了解 LeanCloud 实时通信功能。

应用体验下载地址：[http://fir.im/leanchat](http://fir.im/leanchat)

## Leanchat 项目构成

* [Leanchat-android](https://github.com/leancloud/leanchat)：Android 客户端
* [Leanchat-ios](https://github.com/leancloud/leanchat-ios)：iOS 客户端
* [Leanchat-cloud-code](https://github.com/leancloud/leanchat-cloudcode)：服务端，使用 LeanCloud [云代码](https://leancloud.cn/docs/cloud_code_guide.html) 实现

如果你从 github clone 速度很慢，可以从 [这里](https://download.leancloud.cn/demo/) 下载项目源码压缩包。

## 部署服务端

### 修改 appId 和 appKey

clone 项目，或者下载源代码，修改 `config/global.json` 文件中 `applicationId` 和 `applicationKey` 属性。

### 部署

你可以选择自己喜欢的方式部署服务端程序：

* git 仓库部署：[相关文档](https://leancloud.cn/docs/cloud_code_guide.html#部署代码)
* 命令行工具部署：[相关文档](https://leancloud.cn/docs/cloud_code_commandline.html#部署)

## 开发相关

### 相关接口

* `addFriend`：双向添加好友，需要参数`fromUserId`,`toUserId`
* `removeFriend`：双向移除好友，参数同上
* `tryCreateAddRequest`：尝试发出添加好友的请求，若已存在等待验证的请求，返回 Error ("已经发过请求了")，否则创建一条 `AddRequest` 记录
* `sign`：对单聊的 watch 进行签名
* `group_sign`：对群组操作进行签名

代码详见 [main.js](https://github.com/leancloud/AdventureCloud/blob/master/cloud/main.js)
