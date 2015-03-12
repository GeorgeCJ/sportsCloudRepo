require("cloud/app.js");
// Use AV.Cloud.define to define as many cloud functions as you want.
// For example:
var mlog = require('cloud/mlog');
var mutil = require('cloud/mutil');
var muser = require('cloud/muser');
var madd=require('cloud/madd');
var mgroup=require('cloud/mgroup.js');
var msign=require('cloud/msign.js');
var mqiniu=require('cloud/mqiniu');
var mchat=require('cloud/mchat');
var spEngagement = require('cloud/engagement') ;

AV.Cloud.define("addFriend", muser.handleAddFriend);
AV.Cloud.define("removeFriend", muser.handleRemoveFriend);

AV.Cloud.define("qiniuUptoken",mqiniu.qiniuUptoken);
AV.Cloud.define("tryCreateAddRequest",madd.tryCreateAddRequest);
AV.Cloud.define("agreeAddRequest",madd.agreeAddRequest);
AV.Cloud.define("saveChatGroup",mgroup.saveChatGroup);
AV.Cloud.beforeSave("_User",muser.beforeSaveUser);
AV.Cloud.define("sign",msign.sign);
AV.Cloud.define("group_sign", msign.groupSign);

AV.Cloud.define("_messageReceived",mchat.messageReceived);
AV.Cloud.define("_receiversOffline",mchat.receiversOffline);

AV.Cloud.define("getStrangers",spEngagement.getStrangers) ;
AV.Cloud.define("engagementWithFriends",spEngagement.engagementWithFriends) ;
AV.Cloud.define("answerEngagementWithFriends",spEngagement.answerEngagementWithFriends) ;
AV.Cloud.define("engagementWithStrangers",spEngagement.engagementWithStrangers) ;

