/**
 * Created by lzw on 14/11/5.
 * Update by Zy on 15/4/10.  Return groupId
 */
var muser=require('cloud/muser');
var mutil=require('cloud/mutil');
var mlog=require('cloud/mlog');

var ChatGroup=AV.Object.extend('AVOSRealtimeGroups');

function _saveChatGroup(groupId,ownerId,groupName){
  var p=new AV.Promise();
  var q=new AV.Query(ChatGroup);
  var user=AV.Object.createWithoutData('_User',ownerId);
  mlog.log('id='+groupId);
  q.get(groupId).then(function(group){
    mlog.log('get succeed');
    group.set('name',groupName);
    group.set('owner',user);
    var acl=new AV.ACL();
    acl.setPublicWriteAccess(false);
    acl.setPublicReadAccess(true);
    acl.setWriteAccess(user,true);
    group.setACL(acl);
    group.save().then(function(){
      p.resolve(groupId);
    },mutil.rejectFn(p));
  },mutil.rejectFn(p));
  return p;
}

function saveChatGroup(req,res){
  var groupId=req.params.groupId;
  var ownerId=req.params.ownerId;
  var name=req.params.name;
  _saveChatGroup(groupId,ownerId,name).then(function(results){
      //mlog.log('id='+ results);
    res.success(results);
  },mutil.cloudErrorFn(res));
}

exports._saveChatGroup=_saveChatGroup;
exports.saveChatGroup=saveChatGroup;
