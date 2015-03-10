/**
 * Created by lzw on 14-9-29.
 */
var mutil = require('cloud/mutil');
var mlog = require('cloud/mlog');
var Avatar=AV.Object.extend('Avatar');

function findUserById(userId,queryFn) {
  var q = new AV.Query('_User');
  if(queryFn){
    queryFn(q);
  }
  return q.get(userId);
}

function findUser(modifyQueryFn) {
  return mutil.findOne('_User', modifyQueryFn);
}

function findUserByName(name) {
  return findUser(function (q) {
    q.equalTo('username', name);
  });
}

function findUsernameById(id){
  var p=new AV.Promise();
  findUserById(id).then(function(user){
    p.resolve(user.get('username'));
  },function(error){
    console.log(error.message);
    p.resolve();
  });
  return p;
}

function findUsers(userIds){
  var q=new AV.Query('_User');
  q.containedIn('objectId',userIds);
  q.include('setting');
  return q.find();
}

function findAllUsers(modifyQueryFn){
  return mutil.findAll('_User',modifyQueryFn);
}

function findFriends(name) {
  var p = new AV.Promise();
  findUserByName(name).then(function (user) {
    user.relation('friends').query().find().then(function (results) {
      p.resolve(results);
    }, mutil.rejectFn(p));
  }, mutil.rejectFn(p));
  return p;
}

function addFriend(user, friend) {
  var friends = user.relation('friends');
  friends.add(friend);
  return user.save();
}

function removeFriend(user, friend) {
  var friends = user.relation('friends');
  friends.remove(friend);
  return user.save();
}

function findBothUser(fromUserId, toUserId) {
  var p = new AV.Promise();
  findUserById(fromUserId).then(function (fromUser) {
    mlog.log('fromUser found');
    findUserById(toUserId).then(function (toUser) {
      mlog.log('find user and resolve');
      p.resolve(fromUser, toUser);
    }, mutil.rejectFn(p));
  }, mutil.rejectFn(p));
  return p;
}

function doRelationForBoth(fromUserId, toUserId, relationFn) {
  var p = new AV.Promise();
  mlog.log('doRelationForBoth');
  findBothUser(fromUserId, toUserId).then(function (fromUser, toUser) {
    mlog.log('find users');
    relationFn(fromUser, toUser).then(function () {
      mlog.log('relationFn once');
      relationFn(toUser, fromUser).then(function () {
        p.resolve();
      }, mutil.rejectFn(p))
    }, mutil.rejectFn(p));
  }, mutil.rejectFn(p));
  return p;
}

function addFriendForBoth(fromUserId, toUserId) {
  return doRelationForBoth(fromUserId, toUserId, addFriend);
}

function removeFriendForBoth(fromUserId, toUserId) {
  return doRelationForBoth(fromUserId, toUserId, removeFriend);
}

function countAvatars(){
  var q=new AV.Query(Avatar);
  return q.count();
}

function findRandomAvatar(){
  var p=new AV.Promise();
  countAvatars().then(function(count){
    var i=Math.floor(Math.random()*count);
    var q=new AV.Query(Avatar);
    q.skip(i);
    q.limit(1);
    q.ascending('createdAt');
    q.first().then(function(avatar){
      p.resolve(avatar);
    },mutil.rejectFn(p));
  },mutil.rejectFn(p));
  return p;
}

function beforeSaveUser(req,res){
  var user=req.object;
  if(user.get('avatar')==null){
    findRandomAvatar().then(function(avatar){
      var url=avatar.get('file').url();
      mlog.log('getFile '+url);
      user.set('avatar',avatar.get('file'));
      res.success();
    },mutil.cloudErrorFn(res));
  }else{
    res.success();
  }
}

function handleRelationRequest(req, res, handleRelationFn) {
  var params = req.params;
  var fromUserId = params.fromUserId;
  var toUserId = params.toUserId;
  handleRelationFn(fromUserId, toUserId).then(function () {
    res.success();
  }, mutil.cloudErrorFn(res));
}

function handleRemoveFriend(req,res){
  handleRelationRequest(req, res, removeFriendForBoth);
}

function handleAddFriend(req,res){
  handleRelationRequest(req, res, addFriendForBoth);
}

exports.findUser = findUser;
exports.findUserById = findUserById;
exports.addFriend = addFriend;
exports.removeFriend = removeFriend;
exports.addFriendForBoth = addFriendForBoth;
exports.removeFriendForBoth = removeFriendForBoth;
exports.findFriends = findFriends;
exports.findAllUsers=findAllUsers;
exports.beforeSaveUser=beforeSaveUser;
exports.findRandomAvatar=findRandomAvatar;
exports.handleAddFriend=handleAddFriend;
exports.handleRemoveFriend=handleRemoveFriend;
exports.findUsernameById=findUsernameById;
exports.findUsers=findUsers;
