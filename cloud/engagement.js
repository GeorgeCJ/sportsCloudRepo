var mlog = require('cloud/mlog');
var muser=require('cloud/muser');
var mutil=require('cloud/mutil');

/*===============================================
  文件:
        engagement.js
   说明:
        本文件包含4个函数,分别是:
        getStrangers:                                      获取陌生人列表
        engagementWithFriends:                  邀请好友
        answerEngagementWithFriends;      回应好友邀请
        engagementWithStrangers;               邀请陌生人
    版本:
        v2.0
    修改时间:
        2015/03/09
    作者:
        ZhuangYan
=================================================*/


/*===============================================

  Description
            获得陌生人列表.陌生人列表会按照_User的updateAt字段进行排序
  Prototype
            Array getStranger(params);
  Input Params
                fromId:                     string         必填,寻找发起人的objectId
                sex:                            string        必填,男/女 寻找的性别
                engagementType     number     邀请类型 1 实力型 2 交友型
                sportType:                 number    必填,运动种类 1 乒乓球 2 网球 3 足球 4 跑步 5 健身 6 篮球 7 羽毛球
                                                                     如果fromUser在sportList里边没有该sportType, 则视为0.
                count:                        number    请求的陌生人数量
  Output Params
                无
  Return Value
                _User类的objectId数组
  测试用例:
                {'fromId':'54e6f747e4b00e64145abd89','sportType':5,'sex':'男','count':3,'engagementType':2}

=================================================*/

function getStrangers(req, res) {
  _getStrangers(req).then(function(result){
    console.log('result='+result);
    res.success(result);
  },function(error){
    console.log(error.message);
    res.success();
  });
}

function _getStrangers(req)
{
     var p=new AV.Promise();
    var returnUserIdArray = new Array();
    var query = new AV.Query('_User');
    query.equalTo("objectId", req.params.fromId);
    query.find({success:function(fromUser){
                   if(fromUser.length < 1)
                   {
                       //[{"sportType":5},{"sportLevel":1},{"sportType":6,"sprotLevel":1},{"sprotType":4,"sportLevel":3}]
                       //[{"sportType":5,"sportLevel":2},{"sportType":2,"sportLevel":1},{"sportType":4,"sportLevel":3}]
                       console.log('Can\'t find user.');
                       return null;
                       //mutil.rejectFn(p);
                   }
                   var sportType = parseInt(req.params.sportType);
                   var tempFromUserSportListArray = fromUser[0].get('sportList');
                   var tempFromUserSportLevel = 0;
                   for(var j = 0; j < tempFromUserSportListArray.length; j++)
                   {
                       //console.log(tempFromUserSportListArray[j].sportType);
                        if(tempFromUserSportListArray[j].sportType == sportType)
                        {
                            tempFromUserSportLevel = tempFromUserSportListArray[j].sportLevel;
                            break;
                        }
                   }
                   //console.log("tempFromUserSportListArray[j].sportType" + sportType);
                   //console.log(req.params.fromId);
                   var query2 = new AV.Query('_User');
                   //console.log(sportType);
                   query2.equalTo('school',fromUser.school);
                   query2.equalTo('sex',req.params.sex);
                   query2.notEqualTo('objectId',req.params.fromId);
                   query2.containedIn('sportList', [{"sportType":sportType,"sportLevel":1},{"sportType":sportType,"sportLevel":2},{"sportType":sportType,"sportLevel":3}]);
                   query2.ascending('updatedAt'); //通过更新时间排序
                   query2.find({
                                   success:function(strangers){
                                       var returnUserIdArrayCount = 0;
                                       for(var i = 0; i < strangers.length; i++)
                                       {
                                           var tempSportListArray = strangers[i].get('sportList');
                                           var tempSportLevel = 0;
                                           for(var j = 0; j < tempSportListArray.length; j++)
                                           {
                                                if(tempSportListArray[j].sportType == sportType)
                                                {
                                                    tempSportLevel = tempSportListArray[j].sportLevel;
                                                }
                                           }
                                           //console.log(strangers[i].id + '   ' + tempSportLevel);
                                           if(req.params.engagementType == 1)
                                           {
                                               //实力型
                                                if(tempSportLevel >= tempFromUserSportLevel)
                                                {
                                                    returnUserIdArray[returnUserIdArrayCount++] = strangers[i].id;
                                                    if(returnUserIdArrayCount >= req.params.count)
                                                    {
                                                        p.resolve(returnUserIdArray);
                                                        return p;
                                                    }
                                                }
                                           }
                                           else if(req.params.engagementType == 2)
                                           {
                                               //交友型

                                               if(tempSportLevel <= tempFromUserSportLevel)
                                               {
                                                   returnUserIdArray[returnUserIdArrayCount++] = strangers[i].id;
                                                   if(returnUserIdArrayCount >= req.params.count)
                                                   {
                                                       p.resolve(returnUserIdArray);
                                                       return p;
                                                   }
                                               }
                                           }
                                       }
                                       p.resolve(returnUserIdArray);
                                       return p;
                                   }
                               });
                   //console.log(tempNewArray[0].sportType + "  " + tempNewArray[0].sportLevel);
               },error:function(error){
                   console.log(error.message);
                   return null;}
               });
    return p;
}

/*===============================================

  Description
            与陌生人约伴
  Prototype
            string engagementWithStrangers(params);
  Input Params
                objectId:       string      可选,如缺少则新建,如有则更新
                when:            string      可选, 格式为:"yyyy-mm-dd hh:mm"
                fromId:         string      必填,约伴邀请方
                toId:              string      必填,被邀请方
                status:           number  必填,-1为完成, 0为原始状态, 1及以上为双方约伴次数
                sportType:    number  必填,运动种类 1 乒乓球 2 网球 3 足球 4 跑步 5 健身 6 篮球 7 羽毛球
                stadium:        string      标准体育场的objectId, 与newStadium二者选其一, 二者都填只接受stadium字段. 二者可都不填.
                newStadium: string      自定义体育馆, 如果没有stadium字段则接受此字段, 需要本字段请不要在参数中出现stadium字段(不是为空)
                                                       有自定义体育馆的请求,将会将新体育馆以及fromId写入类NewStadium
  Output Params
                无
  Return Value
                Engagement类的objectId
  测试用例:
                更新操作:
                    {'objectId':'54fd94d2e4b0a9c25c985a4e','fromId':'54e6f747e4b00e64145abd89',
                    'toId':'54e382e3e4b03118ec313b63','status':3,'sportType':2,'when':'2012-12-12 12:23:21','newStadium':'上海赛车场'}
                新建操作:
                    {'fromId':'54e6f747e4b00e64145abd89',
                    'toId':'54e382e3e4b03118ec313b63','status':3,'sportType':2}

=================================================*/
function engagementWithStrangers(req, res) {
  _engagementWithStrangers(req.params).then(function(result){
    console.log('result='+result);
    res.success(result);
  },function(error){
    console.log(error.message);
    res.success();
  });
}

function _engagementWithStrangers(params)
{
    var p=new AV.Promise();
    //var EngagementStranger = AV.Object.extend("EngagementStrangers");
    var tempEngagement  = AV.Object.new('EngagementStrangers');
    if(params.objectId == null)
    {
        //如果没有objectId字段,人为设置这个字段为空,方便后边查询
        params.objectId = '';
    }
    var tempToId = params.toId;
    var query = new AV.Query('EngagementStrangers');
    query.equalTo("objectId", params.objectId);
    query.find({success:function(results){
                   if(results.length > 0)
                   {
                       tempEngagement = results[0];
                   }
                   var fromPeerId=params.fromId;
                   var toPeerId=tempToId;
                   muser.findUsers([fromPeerId,toPeerId]).then(function(users){
                       if(users.length==2)
                       {
                           var fromPeer;
                           var toPeer;
                           if(users[0].id===fromPeerId)
                           {
                               fromPeer=users[0];
                               toPeer=users[1];
                           }
                           else
                           {
                               fromPeer = users[1];
                               toPeer = users[0];
                           }
                           tempEngagement.set("fromId", fromPeer);
                           tempEngagement.set("toId",toPeer);
                           tempEngagement.set("sportType", parseInt(params.sportType));

                           //写入时间
                           if(params.when != null)
                           {
                               var tempDate=new Date();
                               var tempYear=parseInt(params.when.substring(0,4));
                               var tempMonth=parseInt(params.when.substring(5,7));
                               var tempDay=parseInt(params.when.substring(8,10));
                               var tempHous=parseInt(params.when.substring(11,13));
                               var tempMinutes=parseInt(params.when.substring(14,16));
                               tempDate.setFullYear(tempYear,tempMonth-1,tempDay);
                               tempDate.setHours(tempHous,tempMinutes,0);
                               tempEngagement.set("when", tempDate);
                           }
                           //console.log('when:'+tempDate.toString());

                           //状态,-1为完成,不然每次加1最开始是0
                           var tempStatus = parseInt(params.status);
                           if(tempStatus != -1)
                           {
                               tempEngagement.set("status", tempStatus+1);
                           }
                           else
                           {
                               tempEngagement.set("status", -1);
                           }

                           if(params.stadium == null && params.newStadium == null)
                           {
                                console.log('Both stadium is null.');
                               tempEngagement.fetchWhenSave(true);
                               tempEngagement.save(null,{
                                                       success: function(tempEngagement){
                                                           //console.log(tempEngagement.id);
                                                           console.log('tempEngagement Save Successful');
                                                           p.resolve(tempEngagement.id);
                                                       }
                                                       ,error:function(tempEngagement,error){
                                                           console.log(error);
                                                           mutil.rejectFn(p);
                                                       }
                                                   });
                           }
                           else if(params.stadium != null)
                           {
                               var query = new AV.Query('Stadium');
                               query.equalTo("objectId", params.stadium);
                               query.find({
                                              success: function(results) {
                                                  if(results.length >= 1)
                                                  {
                                                      var tempStadium = results[0];
                                                      tempEngagement.set("stadium", tempStadium);
                                                      tempEngagement.set("newStadium", "");//如果有stadium就把新场馆删掉
                                                      tempEngagement.fetchWhenSave(true);
                                                      tempEngagement.save(null,{
                                                                              success: function(tempEngagement){
                                                                                  //console.log(tempEngagement.id);
                                                                                  console.log('tempEngagement Save Successful');
                                                                                  p.resolve(tempEngagement.id);
                                                                              }
                                                                              ,error:function(tempEngagement,error){
                                                                                  console.log(error);
                                                                                  mutil.rejectFn(p);
                                                                              }
                                                                          });
                                                  }
                                              },
                                              error: function(error) {
                                                  console.log(error);
                                                  mutil.rejectFn(p);
                                              }
                                          });
                           }
                           //如果有新场馆,写到表新场馆中
                           else if(params.newStadium != null)
                           {
                               var tempNewStadium = AV.Object.new('NewStadium');
                               var query2 = new AV.Query('NewStadium');
                                 //console.log("paramsID: " + params.objectId);
                               query2.equalTo("createrUserId", fromPeer);
                               query2.equalTo("newStadium", params.newStadium);
                               query2.find({
                                               success:function(results){
                                                   if(results < 1)
                                                   {
                                                       //只有在不出现的情况下才在newStadium中注册,避免重复注册
                                                       tempNewStadium.set("createrUserId", fromPeer);
                                                       tempNewStadium.set("newStadium", params.newStadium);
                                                       tempNewStadium.save(null,{
                                                                               success: function(tempNewStadium){
                                                                                   //console.log(tempEngagement.id);
                                                                                   console.log('tempNewStadium Save Successful');
                                                                               }
                                                                               ,error:function(tempNewStadium,error){
                                                                                   console.log(error);
                                                                                   mutil.rejectFn(p);
                                                                               }
                                                                           });
                                                   }
                                               }
                                           });
                               tempEngagement.set("newStadium",  params.newStadium);
                               tempEngagement.set("stadium",  null);
                               tempEngagement.fetchWhenSave(true);
                               tempEngagement.save(null,{
                                                       success: function(tempEngagement){
                                                           p.resolve(tempEngagement.id);
                                                           console.log('tempEngagement Save Successful');
                                                       }
                                                       ,error:function(tempEngagement,error){
                                                           console.log(error.message);
                                                           mutil.rejectFn(p);
                                                       }
                                                   });
                           }
                       }
                       else
                       {
                           console.log('find users length != 2');
                           console.log("length =" + users.length);
                           mutil.rejectFn(p);
                       }
                   }, mutil.rejectFn(p));
               },error:function(error){
                   mutil.rejectFn(p)}
               });
    return p;
}

/*===============================================
  Description
            与好友约伴
  Prototype
            Array engagementWithFriends(params);
  Input Params
                groupId:       string         约伴消息将会发送给group中的所有用户
                fromId:         string        必填,约伴邀请方
                type:              number    必填,运动种类 1 乒乓球 2 网球 3 足球 4 跑步 5 健身 6 篮球 7 羽毛球
                when:            string        必填, 格式为:"yyyy-mm-dd hh:mm"
                stadium:        string        与newStadium二者必填其一, 二者都填只接受stadium字段.标准体育场的objectId
                newStadium: string        自定义体育馆, 如果没有stadium字段则接受此字段, 需要本字段请不要在参数中出现stadium字段(不是为空)
                                                         有自定义体育馆的请求,将会讲新体育馆以及fromId写入类NewStadium
  Output Params
                无
  Return Value
                EngagementFriend类objectId数组, 顺序按照GroupId中用户的顺序排列
   测试用例:
                说明: stadium和newStadium字段二者留其一
                {'groupId':'54fc8649e4b08f775337c290','fromId':'54e6f747e4b00e64145abd89','sportType':'2','when':'2012-12-12 12:23:21','stadium':'54ef556ae4b0f26042068c7b','newStadium':'房山滑雪场'}

=================================================*/
function engagementWithFriends(req, res) {
    _engagementWithFriends(req.params).then(function(result){
        console.log('result='+result[0]);
        console.log('result='+result[1]);
        res.success(result);
    },function(error){
        console.log(error.message);
        res.success();
    });
}

function _engagementWithFriends(params) {
    var p=new AV.Promise();
    if(params.groupId==null){
        console.log("groupId == null");
        mutil.rejectFn(p);
    }else{
        muser.findUserById(params.fromId).then(function(fromUser){
                var returnObjectIdArrayCount = 0;
                var returnObjectIdArray = new Array();
                var query = new AV.Query('AVOSRealtimeGroups');
                console.log("groupId: " + params.groupId);
                query.equalTo("objectId", params.groupId);
                query.find({success:function(results){
                    if(results.length > 0)
                    {
                        var tempIndex;
                        var tempUserArrary = new Array();
                        tempUserArrary = results[0].get('m');

                        for(tempIndex in tempUserArrary)
                        {
                            if(fromUser.id == tempUserArrary[tempIndex])
                            {
                                tempUserArrary.splice(tempIndex,1); //把自身删掉
                            }
                        }
                        var tempReturnArray = new Array();
                        for(var i = 0; i < tempUserArrary.length;i++)
                        {
                            params.toId = tempUserArrary[i];
                            tempReturnArray[i] = engagementWithFriendsHelp(params);
                        }
                        //等待所有的engagementWithFriendsHelp函数执行完, 如果不使用Promise.all会由于异步而得不到正确的返回值
                        AV.Promise.all(tempReturnArray).then(
                                                                 function(results){
                                                                    p.resolve(results);
                                                                 });

                    }
                    else
                    {
                        console.log("results.length =" + results.length);
                        mutil.rejectFn(p);
                    }
                }                
        });
    });
    }
    return p;
}

function engagementWithFriendsHelp(params)
{
    var p=new AV.Promise();
    var tempEngagement  = AV.Object.new('EngagementFriends');
    var fromPeerId = params.fromId;
    var toPeerId = params.toId;
    muser.findUsers([fromPeerId,toPeerId]).then(function(users){
        if(users.length==2)
        {
            var fromPeer;
            var toPeer;
            if(users[0].id===fromPeerId)
            {
                fromPeer=users[0];
                toPeer=users[1];
            }
            else
            {
                fromPeer = users[1];
                toPeer = users[0];
            }
            //var tempToId = params.toId;
            tempEngagement.set("toId", toPeer);
            tempEngagement.set("fromId", fromPeer);
            tempEngagement.set("sportType", parseInt(params.sportType));
            tempEngagement.set("answer", 0);
            //写入时间
            var tempDate=new Date();
            var tempYear=parseInt(params.when.substring(0,4));
            var tempMonth=parseInt(params.when.substring(5,7));
            var tempDay=parseInt(params.when.substring(8,10));
            var tempHous=parseInt(params.when.substring(11,13));
            var tempMinutes=parseInt(params.when.substring(14,16));
            tempDate.setFullYear(tempYear,tempMonth-1,tempDay);
            tempDate.setHours(tempHous,tempMinutes,0);
            tempEngagement.set("when", tempDate);
            //console.log('when:'+tempDate.toString());

            if(params.stadium == null && params.newStadium == null)
            {
                console.log('stadium == null');
                mutil.rejectFn(p);
            }
            else if(params.stadium != null)
            {
                var query = new AV.Query('Stadium');
                query.equalTo("objectId", params.stadium);
                query.find({
                               success: function(results) {
                                   if(results.length >= 1)
                                   {
                                       var tempStadium = results[0];
                                       tempEngagement.set("stadium", tempStadium);
                                       tempEngagement.set("newStadium", "");//如果有stadium就把新场馆删掉
                                       tempEngagement.fetchWhenSave(true);
                                       tempEngagement.save(null,{
                                                               success: function(tempEngagement){
                                                                   //console.log(tempEngagement.id);
                                                                   console.log('tempEngagement Save Successful');
                                                                   p.resolve(tempEngagement.id);
                                                               }
                                                               ,error:function(tempEngagement,error){
                                                                   console.log(error.message);
                                                                   mutil.rejectFn(p);
                                                               }
                                                           });
                                   }
                               },
                               error: function(error) {
                                   console.log(error.message);
                                   mutil.rejectFn(p);
                               }
                           });
            }
            //如果有新场馆,写到表新场馆中
            else if(params.newStadium != null)
            {
                                       var tempNewStadium = AV.Object.new('NewStadium');
                                       var query2 = new AV.Query('NewStadium');
                                         //console.log("paramsID: " + params.objectId);
                                       query2.equalTo("createrUserId", fromPeer);
                                       query2.equalTo("newStadium", params.newStadium);
                                       query2.find({
                                                       success:function(results){
                                                           if(results < 1)
                                                           {
                                                               //只有在不出现的情况下才在newStadium中注册,避免重复注册
                                                               tempNewStadium.set("createrUserId", fromPeer);
                                                               tempNewStadium.set("newStadium", params.newStadium);
                                                               tempNewStadium.save(null,{
                                                                                       success: function(tempNewStadium){
                                                                                           //console.log(tempEngagement.id);
                                                                                           console.log('tempNewStadium Save Successful');
                                                                                       }
                                                                                       ,error:function(tempNewStadium,error){
                                                                                            console.log(error.message);
                                                                                           mutil.rejectFn(p);
                                                                                       }
                                                                                   });
                                                           }
                                                       }
                                                   });
                                       tempEngagement.set("newStadium",  params.newStadium);
                                       tempEngagement.set("stadium",  null);
                                       tempEngagement.fetchWhenSave(true);
                                       tempEngagement.save(null,{
                                                               success: function(tempEngagement){
                                                                   p.resolve(tempEngagement.id);
                                                                   console.log('tempEngagement Save Successful');
                                                               }
                                                               ,error:function(tempEngagement,error){
                                                                   console.log(error.message);
                                                                   mutil.rejectFn(p);
                                                               }
                                                           });
                                   }
        }
        else
        {
            console.log('find users length != 2');
            console.log("length =" + users.length);
            mutil.rejectFn(p);
        }
    }, mutil.rejectFn(p));

    return p;
}

/*===============================================
  Description
            回应好友邀请
  Prototype
            objectId answerEngagementWithFriends(params);
  Input Params
                objectId:       string          EngagementWithFriends类的objectId
                answer:         number      邀请的回应 -1拒绝 1同意
  Output Params
                无
  Return Value
                更新的objectId
   测试用例:
                {'objectId':'54fdabbde4b0ec65c955d236','answer':'-1'}
=================================================*/
function answerEngagementWithFriends(req, res) {
    _answerEngagementWithFriends(req.params).then(function(result){
        console.log('result='+result);
        res.success(result);
    },function(error){
        console.log(error.message);
        res.success();
    });
}

function _answerEngagementWithFriends(params) {
    var p=new AV.Promise();

    if(params.objectId==null || (params.answer != 1 && params.answer != -1)){
        console.log("objectId == null Or answer wrong");
        mutil.rejectFn(p);
    }else{
         var tempAnswer = parseInt(params.answer);
         var tempEngagement  = AV.Object.new('EngagementFriends');
        tempEngagement.set("objectId",  params.objectId);
        tempEngagement.set("answer",  tempAnswer);
        tempEngagement.save(null,{
                        success: function(tempEngagement){
                            p.resolve(tempEngagement.id);
                            console.log('tempEngagement Save Successful');
                        }
                        ,error:function(tempEngagement,error){
                            console.log(error.message);
                            mutil.rejectFn(p);
                        }
        });
    }
    return p;
}


//随机数产生函数, 1个参数产生0-under的随机整数,2个参数产生under到over的随机整数
function randomBy(under, over){
          switch(arguments.length){
              case 1: return parseInt(Math.random()*under+1);
              case 2: return parseInt(Math.random()*(over-under+1) + under);
              default: return 0;
          }
}


exports.engagementWithFriends=engagementWithFriends;
exports.answerEngagementWithFriends=answerEngagementWithFriends;
exports.engagementWithStrangers=engagementWithStrangers;
exports.getStrangers=getStrangers;
