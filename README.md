# Simple-Chat-App
一個簡易聊天網站:
* 公共聊天室訊息通知
* 私人聊天室未讀訊息數
* 私人聊天訊息已讀提示
* 加入好友功能
* 好友離線可留言給對方 (對方上線會看到未讀訊息數)
* 好友列表顯示好友連線狀態

可擴展方向:
* 好友列表可移除好友
* 好友列表可更改好友暱稱 (僅客戶端顯示，對方並不會更改)

## Built With
* [Node.js](https://nodejs.org/en/) - version 18.14.2
* [MongoDB](https://www.mongodb.com/try/download/community) - version 6.0.4

## Usage
```sh
git clone https://github.com/LinZH-1995/socket-practice.git chatapp
```
```sh
cd chatapp
```
```sh
yarn install
```
```sh
yarn run seed
```
```sh
yarn run start
```
### Seed Users
* user1：
  * email: user1@example.com
  * password: 123456
* user2：
  * email: user2@example.com
  * password: 123456
