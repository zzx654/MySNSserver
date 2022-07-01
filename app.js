
const express=require('express');
const http = require('http')
const jwt=require('jsonwebtoken');
const nodemailer=require('nodemailer')
const fromEmail = 'mhyhl220@gmail.com'
const axios = require('axios');
const cache=require('memory-cache')
const app=express();
var fs = require('fs');
const mysql=require('mysql')
app.use(express.static('files')) // images 폴더를 읽도록 함
const server = http.createServer(app)
const io = require('socket.io')(server)
var bodyParser=require('body-parser')
var CryptoJS = require("crypto-js");
const bcrypt = require('bcrypt');
const e = require('express');


const sharp = require("sharp");
const multer = require('multer')
const multerS3=require('multer-s3')
const AWS=require("aws-sdk")
 const path = require('path');
const { verify } = require('crypto');
const s3bucket = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
  });
const randomstring = require('randomstring');
const { isBuffer } = require('util');
require('dotenv').config()
const fileUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, `${__dirname}/files`) // images 폴더에 저장
    },
		filename: (req, file, cb) => {
			
			var mimetype;
            console.log(file.mimetype)
			switch (file.mimetype) {
				case 'image/jpeg':
					mimeType = 'jpg';
					break;
				case 'image/png':
					mimeType = 'png';
					break;
				case 'image/gif':
					mimeType = 'gif';
					break;
				case 'image/bmp':
					mimeType = 'bmp';
					break;
                case 'audio/wav':
                    mimeType = 'wav';
                    break;
                case 'audio/mp3':
                    mimeType = 'mp3';
                case 'audio/mpeg':
                    mimeType = 'mpeg';
                    break;
				default:
					mimeType = 'jpg';
					break;
			}
            var fileName = randomstring.generate(25); // 랜덤 25자의 파일 이름
			cb(null, fileName + '.' + mimeType);
		},
  }),
  limits: {
    fileSize: 10 * 1024 * 1024,  // 5MB 로 크기 제한
  },
})

const upload = multer({
    storage: multerS3({
      s3: s3bucket,
      bucket: process.env.S3_BUCKET_NAME,
      key: function(req, file, cb){
        const fileName = file.originalname.toLowerCase().split(" ").join("-");
        cb(null, Date.now() + "-" + fileName);
      },
      acl: "public-read"
    })
  });
const admin=require("firebase-admin")


const { rejects } = require('assert');
const { connect } = require('http2');
const { timeStamp } = require('console');

admin.initializeApp({ credential: admin.credential.cert({
    "projectId":process.env.FIREBASE_PROJECT_ID,
    "privateKey":process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    "clientEmail":process.env.FIREBASE_CLIENT_EMAIL,
}), });

app.get('/stream',(req,res)=>{
    console.log(req.query.name)
    const file=__dirname+'/files'+'/'+req.query.name
    const rstream=fs.createReadStream(file)
    rstream.pipe(res)
})
app.post('/uploadaudio',upload.single('media'),(req,res)=>{
    console.log(req.file)
  
  
  const Data = {
    resultCode: 1,
    uri : req.file.location
  }
  res.send(JSON.stringify(Data))
})



app.post('/uploadmultiple',upload.array('image'),(req,res)=>{
    //console.log(req.files)
    var imgJsonArray=new Array()
    var imgJson=new Object()
    for(var i=0;i<res.req.files.length;i++)
    {
        imgJson={}
        imgJson.imageUri=req.files[i].location
        console.log(imgJson.imageUri)
        imgJsonArray.push(imgJson)
        console.log(imgJsonArray[i].imageUri)
    }
    console.log(res.req.files)
    const imageData = {
        resultCode : 1,
        imageUris : JSON.stringify(imgJsonArray)
      }
  
      res.send(imageData)
})
// 이미지 업로드
app.post('/upload', fileUpload.single('image'), (req, res) => {
  console.log(req.file)
  
  
  const imageData = {
    result : 1,
    imageUri : res.req.file.filename
  }
  res.send(JSON.stringify(imageData))
})
app.post('/uploadimg', verifyToken,upload.single('image'), (req, res) => {
    console.log(req.file)
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            console.log('인증오류발생')
            deleteToken(req.token,function(){
            res.json({
             resultCode:505,
             imageUri:image
          })
          })
        }
        else
        {
                    var image=req.file.location
               
                    res.json({
                        resultCode:200,
                        imageUri:image
                    })
                
        }
    })
  

  })
  app.post('/uploadimg', fileUpload.single('image'), (req, res) => {
    console.log(req.file)
    var image='https://socialanony.herokuapp.com/' +req.file.filename
    res.json({
        resultCode:200,
        imageUri:image
    })
  })


// 소켓 연결 코드
io.sockets.on('connection', (socket) => {
  console.log(`Socket connected : ${socket.id}`)


  socket.on('enter', (data) => {
    const roomData = JSON.parse(data)

    const roomNumber = roomData.roomid
    const userid=roomData.myid


    socket.join(`${roomNumber}`)


  })

  socket.on('recordsocket',(requestdata)=>{
    const data=JSON.parse(requestdata)
    const id=socket.id
    var userid=data.userid
    var param=[id,userid]
    var insertsocket='UPDATE user set socketid=? where userid=?'
    console.log('')
    connection.query(insertsocket,param,function(err,result){
      if(err)
      {
          console.log(err)
      }
      else{
          console.log(socket.id)
      }
  })
  })

  socket.on('left', (data) => {
    const roomData = JSON.parse(data)
      const roomNumber = roomData.roomid
    socket.leave(`${roomNumber}`)
    console.log('leave')
  })
    socket.on('newMessage', (data) => {
    const messageData = JSON.parse(data)


    var getmy='select *from user where userid=?'
    var exit1='update chatroom set participant=? where participant=? and roomid=?'
    var exit2='update chatroom set organizer=? where organizer=? and roomid=?'
    var getuser='SELECT *FROM user WHERE userid=? and userid not in (select userid from block where blockeduserid=?) and userid not in (select blockeduserid from block where userid=?)'

    var curtime=timestamp()
    if(messageData.type=='EXIT')
    {
        connection.query(exit1,[0,messageData.senderid,messageData.roomid],function(err,result){
            if(err)
            {
                console.log(err)
            }
            else{
                console.log('exit1성공')
            }
        })
        connection.query(exit2,[0,messageData.senderid,messageData.roomid],function(err,result){
            if(err)
            {
                console.log(err)
            }
            else{
                console.log('exit2성공')
            }
        })
    }
    if(messageData.receiverid!=0)
    {
        connection.query(getuser,[messageData.receiverid,messageData.senderid,messageData.senderid],function(err,userresult){
            if(err)
            {
                console.log(err)
            }
            else{
                if(userresult.length!=0)
                {                   
                        if(userresult[0].fcmtoken==='')
                        {
                            console.log('상대가 로그아웃중')
                        }
                        else{
                           var content=messageData.content
                            if(messageData.type=='IMAGE')
                                content='사진을 보냈습니다.'
                            var payload={
                                data:{
                                  //  dateChanged:String(dchanged),
                                  //
                                    senderid:String(messageData.senderid),
                                    roomid:messageData.roomid,
                                    date:curtime,
                                    type:messageData.type,
                                    content:messageData.content,
                                    title:'고민나눔',
                                    message:userresult[0].nickname+':'+content,
                                    notitype:'chat',
                                    click_action:'NOTIFICATION_CLICK'
                                },
                                token:userresult[0].fcmtoken
                            }
                    
                            
                            admin.messaging().send(payload)
                            .then(function(response){
                                console.log("Succesfully send message",response)
                            })
                            .catch(function(error){
                                console.log("Error sending message",error)
                            })
                        }
                        connection.query(getmy,messageData.senderid,function(err,result){
                            if(err)
                            {
                                console.log(err)
                            }
                            else{
                                var roomcontent={
                                    //dateChanged:dchanged,
                                    profileimage:result[0].profileimage,
                                    nickname:result[0].nickname,
                                    gender:result[0].gender,
                                    senderid:messageData.senderid,
                                    roomid:messageData.roomid,
                                    date:curtime,
                                    type:messageData.type,
                                    content:messageData.content
                                }
                                var sentmessage={
                                    type:messageData.type,
                                    content:messageData.content,
                                    date:curtime
                                }
                                io.to(result[0].socketid).emit('sendResponse',JSON.stringify(sentmessage))
                                io.to(userresult[0].socketid).emit('updaterooms',JSON.stringify(roomcontent))
                                //socket.broadcast.to(`${messageData.roomid}`).emit('update', JSON.stringify(sendcontent))
                            }
                        })
                }
            }
        })
    }
})

  socket.on('disconnect', () => {
    console.log(`Socket disconnected : ${socket.id}`)
  })
})

var db_config ={
    host: 'us-cdbr-east-05.cleardb.net',
    user: "b6329179833105",
    database: "heroku_3ffce85cd7fd33c",
    password: "41ebc80c",
    port: "3306",
    charset:"utf8mb4",
    dateStrings:'date'
}
var connection; 
function handleDisconnect() {
    connection = mysql.createConnection(db_config); // Recreate the connection, since
                                                    // the old one cannot be reused.
  
    connection.connect(function(err) {              // The server is either down
      if(err) {                                     // or restarting (takes a while sometimes).
        console.log('error when connecting to db:', err);
        setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
      }                                     // to avoid a hot loop, and to allow our node script to
    });                                     // process asynchronous requests in the meantime.
                                            // If you're also serving http, display a 503 error.
    connection.on('error', function(err) {
      console.log('db error', err);
      if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
        handleDisconnect();                         // lost due to either server restart, or a
      } else {                                      // connnection idle timeout (the wait_timeout
        throw err;                                  // server variable configures this)
      }
    });
  }
  
  handleDisconnect();
app.use(express.urlencoded({extended: true}));
app.use(express.json())
app.get('/api',(req,res)=>{
    res.json({
        message:'Welcome to the API'
    });
});


const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'mhyhl220@gmail.com',
    pass: 'woghbeyyhpjiurnj',
  },
  tls:{
    rejectUnauthorized: false
}
})

module.exports = transporter
function sendEmail(toEmail, title, txt) { 
      let mailOptions = {
        from: fromEmail,        //보내는 사람 주소
        to: toEmail ,           //받는 사람 주소
        subject: title,         //제목
        text: txt               //본문
    };

    //전송 시작!
    transporter.sendMail(mailOptions, function(error, info){
        
        if (error) {
            //에러
            console.log(error);
        }
        //전송 완료
        console.log("Finish sending email : " + info.response);        
        transporter.close()
    })
}

app.post('/changepassword',verifyToken,(req,res)=>{

    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
        console.log('인증오류발생')
        deleteToken(req.token,function(){
        res.json({
            resultCode:505,
            value:505
        
        });
    })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var curpw=req.body.curpw
            var newpw=req.body.newpw
            var getmy='select *from user where platform=? and account=?'
            connection.query(getmy,[platform,account],function(err,myresult){
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    if(myresult.length==0)
                    {
                        console.log('회원정보찾기실패')
                    }
                    else
                    {
                        bcrypt.compare(curpw,myresult[0].password,function(err,result){

                            if(err){
                                console.log('bcrypt. compare() error:',err.message);
                                res.json({
                                    resultCode:400,
                                    value:400
                                
                                });
                            }else{
                                //console.log(res)
                                if(result){
                                    if(curpw==newpw)
                                    {
                                        res.json({
                                            resultCode:300,
                                            value:300
                                        })
                                    }
                                    else
                                    {
                                        var encrypted=bcrypt.hashSync(newpw,10)
                                        var updatepw='update user set password=? where platform=? and account=?'
                                        connection.query(updatepw,[encrypted,platform,account],function(err,result){
                                            if(err)
                                            {
                                                console.log(err)
                                            }
                                            else
                                            {
                                                res.json({
                                                    resultCode:200,
                                                    value:200
                                                
                                                });
                                            }
                                        })
                                    }
                                  
                                }
                                else
                                {
                                    res.json({
                                        resultCode:400,
                                        value:400
                                    
                                    });
                                }
                            }
                        })
                    }
                }
            })
      
        }
    })
})
app.post('/onlytest',(req,res)=>{
    var payload={
        data:{
            title:'고민나눔',
            message:'아무거나',
            notitype:'comment',
            click_action:'NOTIFICATION_CLICK'
        },
        token:'fNWHDoboRY-LrpDLI-3iUd:APA91bGaKBDDhv97MEktZaD743KqGzfNQK1tComBT088qKrBHku2_90QkAVEdXvWOMoQfNj_5VAo34TS3ffkImTerqru557AKakTvMryRSeVrY3Cn4SWM88CUf_Aj2rGHiamawIw0y6l'
    }
    
    admin.messaging().send(payload)
    .then(function(response){
        console.log("Succesfully send message",response)
    })
    .catch(function(error){
        console.log("Error sending message",error)
    })
    res.json({
        message:'후 됐노'
    })
})
app.post('/findpassword',(req,res)=>{
    var email=req.body.email
    let number=Math.random().toString(36).slice(2)
    var newpw=String(number)
    var encrypted=bcrypt.hashSync(newpw,10)
    var getmy='select *from user where platform=? and account=?'
    connection.query(getmy,['NONE',email],function(err,result){
        if(err)
        {
            console.log(err)
        }
        else
        {
            if(result.length==0)
            {
                res.json({
                    resultCode:400,
                    value:400
                })
            }
            else
            {
                var updatepw='update user set password=? where platform=? and account=?'
                connection.query(updatepw,[encrypted,'NONE',email],function(err,result){
                    if(err)
                    {
                        console.log(err)
                    }
                    else
                    {
                        sendEmail(email,'[고민나눔] 변경된 임시비밀번호입니다','변경된 임시비밀번호는 '+newpw+'입니다')
                        res.json({
                            resultCode:200,
                            value:200
                        })
                    }
                })
            }
        }
    })

})

app.post('/requestEmail',(req,res)=>{

    var email=req.body.email
    console.log(email)
    
    var sql='select *from user where account=? and platform=?'
    var param=[email,'NONE']
    connection.query(sql,param,function(err,result){
        
        if(err)
        {
            console.log(err)
        }
        else{
            
            if(result.length==0)
            {
                 
               res.json({
                   resultCode:200
               })
            }
            else{
                res.json({
                    resultCode:100
                })
            }
        }
    })
   


})
app.post('/postContent',(req,res)=>{
    res.json({
        text:req.body.content,
        imageUri:req.body.imageUri
    })
})
app.post('/postContents',verifyToken,(req,res)=>{

  
    var postid=req.body.postid
    var voteoptions=req.body.voteoptions

    var anonymous=req.body.anonymous
    var text=req.body.text

    var tags=req.body.tags
    var latitude=req.body.latitude
    var longitude=req.body.longitude
    var date=timestamp()
    var image=req.body.image
    var audio=req.body.audio
    console.log(latitude)
    jwt.verify(req.token,'secretkey',(err,authData)=>{
       if(err)
       {

       }
       else
       {
        var account=authData.user.account
        var platform=authData.user.platform
        var arr=new Array();

        if(tags!=undefined)
        {
            var tagarray=tags.split('#')
            for(var i=0; i<tagarray.length;i++)
            {
                arr[i]=new Array()
                arr[i][0]=postid
                arr[i][1]=tagarray[i]
        
            }
        
            var inserttag='insert into posttag (postid,tagname) values ?'
        
        
            connection.query(inserttag,[arr],function(err,result){
        
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    console.log('태그삽입성공')
                }
            })
        
        }
        if(voteoptions!=undefined)
        {
            var voteoptionsarr=new Array()
            var voptionsarray=JSON.parse(voteoptions)
            for(var i=0;i<voptionsarray.length;i++)
            {
                voteoptionsarr[i]=new Array()
                voteoptionsarr[i][0]=postid
                voteoptionsarr[i][1]=voptionsarray[i].voteoption
            }
            var insertvoteoptions='insert into polloption (postid,choicetext) values ?'

            connection.query(insertvoteoptions,[voteoptionsarr],function(err,result){
                if(err)
                {
                    console.log('투표insert에러')
                }
                else{
                    console.log('투표삽입성공')
                }
            })

        }
     
       
        var getmyInfoParam=[account,platform]
    
        var getinfoquery='select userid,gender from user where account=? and platform=? '
    
        connection.query(getinfoquery,getmyInfoParam,function(err,result){
            if(err)
            {
                console.log(err)
            }
            else
            {
                var postparam=new Array()
        
                var i=0
                
            
                var postquery='insert into post(userid,'
            
                postparam[i++]=result[0].userid
                if(longitude!=undefined)
                {
                    postquery+='latitude,longitude,'
                    postparam[i++]=latitude
                    postparam[i++]=longitude
                }
                postquery+='vote,'
                if(voteoptions!=undefined)
                {
                   postparam[i++]='exist'
                }
                else{
                    postparam[i++]='none'
                }
            
                postparam[i++]=postid
                postparam[i++]=account
                postparam[i++]=platform
                if(anonymous=='NONE')
                {
                    postquery+="postid,account,platform,gender,text,date,image,audio) values (?)"
    
                }
                else
                {
                    postquery+="postid,account,platform,anonymous,gender,text,date,image,audio) values (?)"
                    postparam[i++]=anonymous
                 }
                postparam[i++]=result[0].gender
                postparam[i++]=text
                postparam[i++]=date
                postparam[i++]=image
                postparam[i]=audio
    
                connection.query(postquery,[postparam],function(err,result){
                    if(err)
                    {
                        console.log(err)
                    }
                    else
                    {
                        console.log('삽입성공')
                    }
                })
            }
           
        })
    
        res.send('200')
    

        console.log(latitude)
    
        console.log(req.body)

       }
    })
 
    
    
   

})
app.post('/checknick',(req,res)=>{
    var nickname=req.body.nickname
    var checknick='select *from user where nickname=?'
    connection.query(checknick,nickname,function(err,result){
        if(err)
        {
            console.log(err)
        }
        else
        {
            if(result.length==0)
            {
                res.json({
                    resultCode:200,
                    value:200
                })
            }
            else{
                res.json({
                    resultCode:300,
                    value:300
                })
            }
        }
    })
})
app.post('/editprofile',verifyToken,(req,res)=>{
    console.log('editprofile')
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
        console.log('인증오류발생')
        deleteToken(req.token,function(){
        res.json({
            resultCode:505,
            value:505
        })
    })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
              //var account=req.body.account
    var imageuri=req.body.imageuri
    var nickname=req.body.nickname
    console.log(account)
    console.log(imageuri)
   // var platform=req.body.platform
    var param=[]
    var query=''

    if(imageuri==undefined)
    {
        query='update user set nickname=?,profileimage=NULL where platform=? and account=?'
        param=[nickname,platform,account]
    }
    else if(imageuri=='notchanged')
    {
        query='update user set nickname=? where platform=? and account=?'
        param=[nickname,platform,account]
    }
    else
    {
        query='update user set nickname=?,profileimage=? where platform=? and account=?'
        param=[nickname,imageuri,platform,account]

    }
    connection.query(query,param,function(err,result){
        if(err)
        {
            console.log(err)
            res.json({
                resultCode:400,
                value:400
            })
        }
        else
        {
            res.json({
                resultCode:200,
                value:200
            })
        }
    })
        }
   })
  
})
app.post('/authcomplete',verifyToken,(req,res)=>{

    //var platform=req.body.platform
    //var account=req.body.account
    var nickname=req.body.nickname
    var gender=req.body.gender
    var age=req.body.age


    //console.log(platform)
    //console.log(account)
    console.log(gender)
    console.log(nickname)

    console.log('authcomplete')
   // var param=[nickname,gender,age,platform,account]
    var nicknamecheck='select *from user where binary(nickname)=?'
    var insertquery='update user set nickname=?,gender=?,age=? where platform=? and account=?'

    connection.query(nicknamecheck,nickname,function(err,result){
        var message='오류 발생'
        if(err)
        {
            console.log(err)
        }
        else{
            if(result.length==0)
            {
                console.log(req.token)
                jwt.verify(req.token,'secretkey',(err,authData)=>{
                    if(err)
                    {
                        res.json({
                            message:'인증실패'
                        })
                    }
                    else
                    {
                        connection.query(insertquery,[nickname,gender,age,authData.user.platform,authData.user.account],function(err,result){
                            if(err)
                            {
                                console.log(message)
                            }
                            else{
                                res.json({
                                    message:'저장 완료'
                                })
                            }
        
                        })
                    }
                   
                })
            
            }
            else{
                res.json({
                    message:'닉네임이 중복되었습니다'
                })

            }
        }

    })
})

app.post('/register',(req,res)=>{

    var account=req.body.email;
    //var name=req.body.name;
    var password=req.body.password;
    console.log(password)

    var encrypted=bcrypt.hashSync(password,10)
    console.log(encrypted)
    //var params=[name,encrypted,email];
    var params=['NONE',encrypted,account];
    var param=[account,'NONE']
    console.log(params)
    var checkquery='SELECT *FROM user WHERE account=? and platform=?';
    var insertquery='INSERT INTO user(platform,password,account) VALUES(?,?,?)';
                                                                                                                                                                                                                                                   
    connection.query(checkquery,param,function(err,result){
        var resultCode=404;
        var message='가입 오류 발생'
        

        if(err){
            console.log(err);
        }
        else{
            if(result.length==0){
                console.log(insertquery)
                console.log(params)
                connection.query(insertquery,params,function(err,result){

                    if(err)
                    {
                    
                    }
                
                });
                message='회원가입에 성공했습니다.'
            }
            else{
                message='이미 존재하는 회원입니다.'
            }

        }
        console.log(message)
        res.json({
            message:message
        });
    });

    

});


app.post('/test',(req,res)=>{

    

    var password=req.body.password

    var hahed=bcrypt.hashSync(password,10)

    res.json({
        message:hahed
    });
    

});


//최초로그인
app.post('/api/login',(req,res)=>{
    //Mock user

    var email=req.body.email
    var password=req.body.password
    var fcmtoken=req.body.fcmToken
    console.log(email)

    const user={
        account:email,
        platform:'NONE'
    }

    var param=[email,'NONE']
    var sql='select *from user where account=? and platform=?'
    connection.query(sql,param,function(err,myresult){
 
       if(err){
            console.log(err)
            res.json({
                message:'login 에러가 발생했습니다.',
                restoken:''
            });
        }else{
            if(myresult.length===0){
                res.json({
                    message:'존재하지 않는 계정입니다.',
                    restoken:''
                });
            }
            else{
                console.log(password)
               bcrypt.compare(password,myresult[0].password,function(err,result){

                if(err){
                    console.log('bcrypt. compare() error:',err.message);
                    res.json({
                        message:'login 에러가 발생했습니다.',
                        restoken:''
                    });
                }else{
                    //console.log(res)
                    if(result){
            
                        if(myresult[0].fcmtoken!="")
                        {
                            if(myresult[0].fcmtoken!=fcmtoken)
                            {
                                const logoutData = {
                                    type : "logoutreceive"
                                     
                                  }
                                io.to(myresult[0].socketid).emit('logout',JSON.stringify(logoutData))
                            }
                       
                        }
                  
                        message='로그인 성공'
                        jwt.sign({user:user},'secretkey',{expiresIn:'20d'},(err,token)=>{
                            if(err)
                            {
                                console.log(err)
                            }
                      
                            var saveToken='update user set authtoken=?,fcmtoken=? where account=? and platform=?'
                            var param=[token,fcmtoken,email,'NONE']
                    
                            connection.query(saveToken,param,function(err,result){
                         
                                if(err)
                                {
                                    console.log(err)
                                }
                                else{
                                    console.log("토큰저장성공")
                                }
                            })
                            res.json({
                                message:email,
                                restoken:token
                            });
                            
                    
                        });
                     
                    }
                    else{
    
                        message='비밀번호가 틀렸습니다!'
                        res.json({
                            message:'비밀번호가 틀렸습니다!',
                            restoken:''
                        });
                      }
                    }
                 }) ;
                }
         }
  
        });

 

    });

    app.post("/insertroom",verifyToken,(req,res)=>{
        var freindmail=req.body.email
        var freindname=req.body.name
        var roomid=req.body.roomid

        console.log(roomid)
        console.log('insertroom')
        console.log(freindmail)
        var mymailquery='select *from user where authtoken=?'
        connection.query(mymailquery,req.token,function(err,result){
            if(err)
            {
                console.log(err)
            }
            else{
                if(result.length==0){
                    console.log('토큰정보없음')
                }
                else{
                    console.log(result[0].name)
                    var insert1='INSERT INTO chatroom(roomid,organizer,participant) VALUES(?,?,?)';
                    var insert2='INSERT INTO chatlist(email,femail,fname,roomuid) VALUES ?';
                    var insertvalue=[
                        [result[0].email,freindmail,freindname,roomid],
                        [freindmail,result[0].email,result[0].name,roomid]
                    ]
                
                    connection.query(insert2,[insertvalue],function(err,result){
                        if(err)
                        {
                            console.log(err)
                        }
                        else{
                            console.log('삽입성공')
                          
                        }
                    })
                    connection.query(insert1,[roomid,result[0].email,freindmail],function(err,result){
                        if(err)
                        {
                            console.log(err)
                        }
                        else{
                            //console.log('삽입성공')
                            res.json({
                                resultcode:600,
                                roomid:roomid
                            })

                        }
                    })
                }
            }
        })

    })

    app.post("/getMy",verifyToken,(req,res)=>{
        var myquery='select *from user where authtoken=?'

        connection.query(myquery,req.token,function(err,result){
            if(err)
            {
                console.log(err)
            }else{
                if(result.length==0)
                {
                    console.log('토큰정보x')
                    
                }
                else{
                    res.json({
                        mail:result[0].account,
                        name:result[0].name
                    })
                }
            }
        })
    })

    app.post("/roomcheck",verifyToken,(req,res)=>{
        
        var freindmail=req.body.email
        console.log(freindmail)
        var mymailquery='select email from user where authtoken=?'

        console.log(req.token)
        connection.query(mymailquery,req.token,function(err,result){
            if(err)
            {
                console.log(err)
            }
            else{
                if(result.length==0)
                {
                    console.log('토큰정보x')
                    
                }
                else{
                    var roomquery='select *from chatroom where (organizer=? and participant=?) or (participant=? and organizer=?)'
                    var param=[freindmail,result[0].email,freindmail,result[0].email]
                    //var param=[freindmail,result[0].email]
                    //var param=[result[0].email,freindmail]
                    connection.query(roomquery,param,function(err,result){
                        if(err)
                        {
                            console.log(err)
                        }
                        else{
                            if(result.length==0)
                            {
                                res.json({
                                    resultcode:400,
                                    roomid:''
                                })
                            }
                            else{
                                console.log(result[0].roomid)
                                res.json({
                                    resultcode:300,
                                    roomid:result[0].roomid
                                })
                            }
                        }
                    })                
                    console.log(result[0].email)
                }

            }
        })

        
    })
    app.post('/getAccount',verifyToken,(req,res)=>{
        console.log(req.token)
        var tokencheck='select *from user where authtoken=?'
        connection.query(tokencheck,req.token,function(err,result){
            if(err)
            {
                console.log(err)
            }
            else{
                if(result.length==0)
                {
                    console.log('토큰정보X')
                }
                else{
                    res.json({
                        platform:result[0].platform,
                        account:result[0].account
                    })
                }
            }
        })

    })
    app.post('/api/autologin',verifyToken,(req,res)=>{

        var tokencheck='select *from user where authtoken=?'
        console.log(req.token)
        connection.query(tokencheck,req.token,function(err,result){
            if(err)
            {
                console.log(err)
               
            }
            else{
                if(result.length==0)
                {
                    console.log('토큰정보X')
                    res.json({
                        resultCode:401
                    })
                }
                else{
                    jwt.verify(req.token,'secretkey',(err,authData)=>{
                        var message=''
                        var resultcode=404
            
                        if(err){
                            deleteToken(req.token,function(){
                                res.json({
                                    resultCode:505
                                })
                            })
                            
                        }else{
                           
                            var checkProfile='select * from user where platform=? and account=?'
                            connection.query(checkProfile,[authData.user.platform,authData.user.account],function(err,result){
                                if(err)
                                {
                                    console.log(err)
                                }
                                else
                                {
                                    if(result&&result.length)
                                    {
                                        if(result[0].nickname===null)
                                        {
                                            res.json({
                                                resultCode:400
                                            })
                                        }
                                        else{
                                            res.json({
                                                resultCode:200
                                            })
                                        }
                                    }
                                    else
                                    {
                                        res.json({
                                            resultCode:500
                                        })
                                    }
                                }
                            })
                        
                        }
                        
                    })
                }
            }
        })
       




    });
    app.post('/SocialSign',(req,res)=>{
        var platform=req.body.platform
        var account=req.body.account
        var fcmtoken=req.body.fcmtoken
      
        console.log(fcmtoken)

       const user={
            account:account,
            platform:platform
        }
        var checkaccount='select *from user where platform=? and account=?'
        var insertaccount='INSERT INTO user(platform,account,fcmtoken) VALUES (?,?,?)'
        var updatefcmtoken='update user set fcmtoken=? where platform=? and account=?'
        var param1=[platform,account]
        var param2=[platform,account,fcmtoken]
        var param3=[fcmtoken,platform,account]
        connection.query(checkaccount,param1,function(err,result){
            if(err)
            {
                console.log(err)
            }
            else{
                if(result&&result.length)
                {
                    if(result[0].fcmtoken!="")
                    {
                
                        if(result[0].fcmtoken!=fcmtoken)
                        {
                            const logoutData={
                                type:"logoutreceive"
                            }
                            io.to(result[0].socketid).emit('logout',JSON.stringify(logoutData))
                        }
                    }
                    connection.query(updatefcmtoken,param3,function(err,result){
                        if(err)
                        {
                            console.log(err)
                        }
                    
                    })
                 
                }
                else{
                    connection.query(insertaccount,param2,function(err,result){

                        if(err)
                        {
                            console.log(err)
                        }
                        else{
                           
                        }
                    })
                    
                }

                jwt.sign({user:user},'secretkey',{expiresIn:'20d'},(err,authtoken)=>{
                    if(err)
                    {
                        console.log(err)
                    }
                    var saveToken='update user set authtoken=? where account=? and platform=?'
                    var param=[authtoken,account,platform]
                    console.log(authtoken)
                    connection.query(saveToken,param,function(err,result){            
                        if(err)
                        {
                            console.log(err)
                        }
                        else{
                            console.log("토큰저장성공")
                            res.json({
                                message:'소셜로그인성공',
                                restoken:authtoken
                            });
                        }
                    })
                    
                    
            
                });

            }
        })
        
    })
    app.post('/checkNickname',(req,res)=>{
    
        var nickname=req.body.nickname
        var checknick='select *from user where nickname=?'
        connection.query(checknick,nickname,function(err,result){
            if(err)
            {
                console.log(err)
            }
            else{
                if(result&&result.length)
                {
                    res.json({
                        resultCode:400,
                        message:'닉네임 중복'
                    })
                }
                else{
                    res.json({
                        resultCode:100,
                        message:'닉네임 사용가능'
                    })
                }
            }
        })
    })
    app.post('/checkfcmtoken',verifyToken,(req,res)=>{
       // var platform=req.body.platform
        //var account=req.body.account
        jwt.verify(req.token,'secretkey',(err,authData)=>{
            if(err)
            {
                deleteToken(req.token,function(){
                    res.json({
                        resultCode:505,
                        value:505
                    })
                })
            
            }
            else
            {
                var platform=authData.user.platform
                var account=authData.user.account
                var fcmtoken=req.body.fcmtoken
                var checkfcmtoken='select *from user where platform=? and account=? and fcmtoken=?'
                var param=[platform,account,fcmtoken]
        
                connection.query(checkfcmtoken,param,function(err,result){
                    if(err)
                    {
                        console.log(err)
                    }
                    else
                    {
                        console.log(fcmtoken)
                        //console.log(result[0].fcmtoken)
                        if(result.length==0)
                        {
                            console.log(param)

                            res.json({
                                resultCode:100,
                                value:100
                            })
                        }
                        else
                        {
                            res.json({
                                resultCode:200,
                                value:200
                            })
                        }
                    }
                })
            }
       })
       
    })
    app.post('/checkProfile',verifyToken,(req,res)=>{
        //var platform=req.body.platform
        //var account=req.body.account
        var checkProfile='select * from user where platform=? and account=?'
        var insertquery='INSERT INTO user(platform,account) VALUES(?,?)';

      
        jwt.verify(req.token,'secretkey',(err,authData)=>{
            if(err){
                deleteToken(req.token,function(){
                    res.json({
                        resultCode:505
                    })
                })
                
            }else{
                var param=[authData.user.platform,authData.user.account]
                console.log(authData.user.email)
                connection.query(checkProfile,param,function(err,result){
                    if(err)
                    {
                        console.log(err)
                    }
                    else{
                        if(result&&result.length)
                        {
                            if(result[0].nickname===null)
                            {
                                res.json({
                                    resultCode:400
                                })
                            }
                            else{
                                res.json({
                                    resultCode:200
                                })
                            }
                        }
                        else{
                           res.json({
                               resultCode:500
                            })
                        }
                    }
                })
             
            }
        });
       

    })
app.post('/api/logout',verifyToken,(req,res)=>{

   // var account=req.body.account
    //var platform=req.body.platform
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            deleteToken(req.token,function(){
                res.json({
                    message:'로그아웃 실패',
                    resultCode:505
                })
            })
         
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var param=[account,platform]
            var deleteToken='update user set authtoken="",fcmtoken="" where authtoken=?'
            
                
                    connection.query(deleteToken,req.token,function(err,result){
                        if(err)
                        {
                            console.log(err)
                        }
                        else{
                            console.log('토큰삭제및 로그아웃 성공')
                            res.json({
                                message:'로그아웃 성공',
                                resultCode:200
                            })
                        }
                
                    })
         }
   })
 
  
    
})

app.post("/searchTag",(req,res)=>{
    var searched=req.body.tagname
    var query="select tagname,count(*) as count from posttag where tagname like '"+searched+"%' group by tagname"; 

    connection.query(query,function(err,result){
        if(err)
        {
            console.log(err)
        }
        else{
            if(result && result.length)
            {
                res.json({
                    resultCode:200,
                    tags:result
                
                })
            }
            else{
                
                res.json({
                    resultCode:100,
                    tags:[]
                })

            }
        }
    })

})
app.post('/toggleLikePost',verifyToken,(req,res)=>{
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            deleteToken(req.token,function(){
             res.json({
                  resultCode:505,
                  toggle:505
             })
            })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var date=timestamp()
            var togglemy=req.body.togglemy
            var postuserid=req.body.postuserid
            //var platform=req.body.platform
            var postid=req.body.postid
            //var account=req.body.account
            var isLiked=req.body.isLiked
            var insertlike='insert into likepost(postid,platform,account) values(?,?,?)'
            var deletelike='delete from likepost where postid=? and platform=? and account=?'
            var insertnoti='insert into noti(platform,account,date,type,text,postid) values(?,?,?,?,?,?)'
            var getnoti='select *from noti where platform=? and account=?'
            var getuser='select *from user where userid=?'
            var param=[postid,platform,account]
            var postexistquery='select *from post where postid=?'
            var query=""
        
            if(togglemy=='false')
            {
            }
        
            if(isLiked==0)
            {
                query=insertlike
            }
            else
            {
                query=deletelike
            }
            connection.query(postexistquery,postid,function(err,result){
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    if(result.length==0)
                    {
                        res.json({
                            resultCode:100,
                            toggle:isLiked
                        })
                    }
                    else{
                        
                        connection.query(query,param,function(err,result){
                            if(err)
                            {
                                console.log(err)
                            }
                            else{
                                
                        
                                if(isLiked==0)
                                {
                                
                                    console.log(togglemy)
                                    if(togglemy == 'false')
                                    {
                                        connection.query(getuser,postuserid,function(err,userresult){
                                            if(err)
                                            {
                                                console.log(err)
                                            }
                                            else
                                            {
                                                param=[userresult[0].platform,userresult[0].account,date,2,'누군가 당신의 글을 좋아합니다',postid]
                                                connection.query(insertnoti,param,function(err,result){
                                                    if(err)
                                                    {
                                                        console.log(err)
                                                    }
                                                    else
                                                    {
                                                    
                                                    
                                                                const notiData = {
                                                                    notiid : result.insertId,
                                                                    type:2,
                                                                    text:'누군가 당신의 글을 좋아합니다',
                                                                    date:date,
                                                                    postid:postid,
                                                                    isread:0
                                                                  }
                                                                io.to(userresult[0].socketid).emit('updatenoti',JSON.stringify(notiData))
                                                       
                                                        var payload={
                                                            data:{
                                                                title:'고민나눔',
                                                                message:'누군가 당신의 글을 좋아합니다',
                                                                notitype:'favorite',
                                                                click_action:'NOTIFICATION_CLICK'
                                                            },
                                                            token:userresult[0].fcmtoken
                                                        
                                                        }
                                                        if(userresult[0].fcmtoken!="")
                                                        {
                                                            admin.messaging().send(payload)
                                                            .then(function(response){
                                                                console.log("Succesfully send message",response)
                                                            })
                                                            .catch(function(error){
                                                                console.log("Error sending message",error)
                                                            })
                                                        }
                                                        
                                                    }
                                                
                                                
                                                })
                                            }
                                        })
                              
                                      
            
                                        
        
                                        //fcm과  소켓으로 알림리스트 다시 보내기
                                    }
                                }
                             
                                res.json({
                                    resultCode:200,
                                    toggle:isLiked
                                })
                            }
                        })
                    
                    }
                }
            })
        }
   })
  


})
app.post('/toggleBookmarkPost',verifyToken,(req,res)=>{
   // var platform=req.body.platform
    //var account=req.body.account
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                toggle:isMarked
            })
        })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var postid=req.body.postid
            var isMarked=req.body.isMarked
            var param=[postid,platform,account]
            var insertbookmark='insert into bookmark(postid,platform,account) values(?,?,?)'
            var deletebookmark='delete from bookmark where postid=? and platform=? and account=?'
            var query=""
            var postexistquery='select *from post where postid=?'
            
            if(isMarked==0)
            {
                query=insertbookmark
            }
            else
            {
                query=deletebookmark
            }
            connection.query(postexistquery,postid,function(err,result){
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    if(result.length==0)
                    {
                        res.json({
                            resultCode:100,
                            toggle:isMarked
                        })
                    }
                    else
                    {
                        connection.query(query,param,function(err,result){
                            if(err)
                            {
                                console.log(err)
                            }
                            else{
                             
                                res.json({
                                    resultCode:200,
                                    toggle:isMarked
                                })
                            }
                        })
                    }
                }
            })
           
        }
   })
  


})
app.post('/toggleFollow',verifyToken,(req,res)=>{
    var userid=req.body.userid
    var following=req.body.following
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                value:505
            })
        })
        }
        else
        {
            var getmy='select *from user where platform=? and account=?'
            var platform=authData.user.platform
            var account=authData.user.account
     
            connection.query(getmy,[platform,account],function(err,myresult){
                if(err){
                    console.log(err)
                }else{
                    var query=""
                    var param=[userid,myresult[0].userid]
                    if(following==0)
                    {
                        var getuser='select *from user where userid=?'
                        connection.query(getuser,userid,function(err,userresult){
                            if(err){
                                console.log(err)
                            }
                            else{
                                var notimessage=myresult[0].nickname+'님이 당신을 팔로우했습니다'
                                var insertnoti='insert into noti(platform,account,date,type,text,followerid) values(?,?,?,?,?,?)'
                                var date=timestamp()
                                var notiparam=[userresult[0].platform,userresult[0].account,date,6,notimessage,myresult[0].userid]
                                connection.query(insertnoti,notiparam,function(err,result){
                                    if(err){
                                        console.log(err)
                                    }
                                    else{
                                        const notiData = {
                                            notiid : result.insertId,
                                            type:6,
                                            text:notimessage,
                                            date:date,
                                            followerid:myresult[0].userid,
                                            isread:0
                                          }
                                          io.to(userresult[0].socketid).emit('updatenoti',JSON.stringify(notiData))
                                          var payload={
                                            data:{
                                                title:'고민나눔',
                                                message:notimessage,
                                                notitype:'followed',
                                                click_action:'NOTIFICATION_CLICK'
                                            },
                                            token:userresult[0].fcmtoken
                                        
                                        }
                                        if(userresult[0].fcmtoken!="")
                                        {
                                            admin.messaging().send(payload)
                                            .then(function(response){
                                                console.log("Succesfully send message",response)
                                            })
                                            .catch(function(error){
                                                console.log("Error sending message",error)
                                            })
                                        }
                                    }
                                })
                                
                            }
                        })
                        query="insert into follow (userid,follower) values(?,?)"
               


                
                    }
                    else{
                        query="delete from follow where userid=? and follower=?"
                    }
                    connection.query(query,param,function(err,result){
                        if(err)
                        {
                            res.json({
                                resultCode:400,
                                value:400
                            })
                        }
                        else
                        {
                            res.json({
                                resultCode:200,
                                value:200
                            })
                        }
                    })
                }
            })
      
        }
    })
})
app.post('/toggleLikeTag',verifyToken,(req,res)=>{
    //var platform=req.body.platform
    //var account=req.body.account
 
    console.log('toggle')

    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            console.log('인증실패')
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                tagname:tagname,
                count:count,
                isLiked:isLiked
            })
        })
        }
        else
        {
            var tagname=req.body.tagname
            var count=req.body.count
            var isLiked=req.body.isLiked
            var platform=authData.user.platform
            var account=authData.user.account
            var param=[tagname,account,platform]
            var inserttag='insert into favoritetags(tagname,account,platform) values(?,?,?)'
            var deletetag='delete from favoritetags where tagname=? and account=? and platform=?'
            var query=""
        
            if(isLiked==0)
            {
                query=inserttag
            }
            else{
                query=deletetag
            }
        
            connection.query(query,param,function(err,result){
                if(err)
                {
                    console.log(err)
                }
                else{
                 
                    res.json({
                        resultCode:200,
                        tagname:tagname,
                        count:count,
                        isLiked:isLiked
                    })
                }
            })
        
        }
     })
   

})
app.post('/getFollowerPerson',verifyToken,(req,res)=>{
    var lastuserid=req.body.lastuserid
    var userid=req.body.userid
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                persons:[]
            })
        })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var param=[platform,account]
          
            var getmyid="select *from user where platform=? and account=?"
            var sql=""
            connection.query(getmyid,param,function(err,myresult){
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    var followingid=0
                    if(userid==undefined){
                        followingid=myresult[0].userid
                    }
                    else{
                        followingid=userid
                    }
       
                
                    if(lastuserid==undefined)
                    {
                        sql="select *from(select user.userid,nickname,gender,if(isnull(profileimage),?,profileimage) as profileimage,if(isnull(myfollow.follower),0,1) as following,if(isnull(followcount.followingcount),0,followcount.followingcount) as followingcount from"+
                        " user left outer join (select *from follow where follower=?) myfollow on user.userid=myfollow.userid"+
                        " left outer join (select userid,count(*) as followingcount from follow group by userid) followcount on user.userid=followcount.userid)searcheduser"+
                        " where userid not in (select userid from block where blockeduserid=?) and userid not in (select blockeduserid from block where userid=?) and userid in (select follower from follow where userid=?) order by userid desc limit 20"
                        param=['none',followingid,myresult[0].userid,myresult[0].userid,followingid]
                    }
                    else{
                        sql="select *from(select user.userid,nickname,gender,if(isnull(user.profileimage),?,user.profileimage) as profileimage,if(isnull(myfollow.follower),0,1) as following,if(isnull(followcount.followingcount),0,followcount.followingcount) as followingcount from"+
                        " user left outer join (select *from follow where follower=?) myfollow on user.userid=myfollow.userid"+
                        " left outer join (select userid,count(*) as followingcount from follow group by userid) followcount on user.userid=followcount.userid)searcheduser"+
                        " where userid not in (select userid from block where blockeduserid=?) and userid not in (select blockeduserid from block where userid=?)  and userid in (select follower from follow where userid=?) and userid<?  order by userid desc limit 20"
                        param=['none',followingid,myresult[0].userid,myresult[0].userid,platform,account,followingid,myresult[0].userid]
                    }
                    connection.query(sql,param,function(err,result){
                        if(err)
                        {
                            console.log(err)
                            res.json({
                                resultCode:400,
                                persons:[]
                            })

                        }
                        else{
                            if(result.length==0)
                            {
                                res.json({
                                    resultCode:300,
                                    persons:[]
                                })
                            }
                            else
                            {
                                res.json({
                                    resultCode:200,
                                    persons:result
                                })
                            }
                        }
                    })
                }
            })

            
           
        }
    })
})
app.post('/getFollowingPerson',verifyToken,(req,res)=>{
    var lastuserid=req.body.lastuserid
    var userid=req.body.userid
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                persons:[]
            })
        })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var param=[platform,account]
          
            var getmyid="select *from user where platform=? and account=?"
            var sql=""
            connection.query(getmyid,param,function(err,myresult){
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    var followerid=''
                    if(userid==undefined){
                        followerid=myresult[0].userid
                    }
                    else
                    followerid=userid
                
                    if(lastuserid==undefined)
                    {
                        sql="select *from(select user.userid,nickname,gender,if(isnull(profileimage),?,profileimage) as profileimage,if(isnull(myfollow.follower),0,1) as following,if(isnull(followcount.followingcount),0,followcount.followingcount) as followingcount from"+
                        " user left outer join (select *from follow where follower=?) myfollow on user.userid=myfollow.userid"+
                        " left outer join (select userid,count(*) as followingcount from follow group by userid) followcount on user.userid=followcount.userid)searcheduser"+
                        " where userid not in (select userid from block where blockeduserid=?) and userid not in (select blockeduserid from block where userid=?) and userid in (select userid from follow where follower=?) order by userid desc limit 20"
                        param=['none',followerid,myresult[0].userid,myresult[0].userid,followerid]
                    }
                    else{
                        sql="select *from(select user.userid,nickname,gender,if(isnull(user.profileimage),?,user.profileimage) as profileimage,if(isnull(myfollow.follower),0,1) as following,if(isnull(followcount.followingcount),0,followcount.followingcount) as followingcount from"+
                        " user left outer join (select *from follow where follower=?) myfollow on user.userid=myfollow.userid"+
                        " left outer join (select userid,count(*) as followingcount from follow group by userid) followcount on user.userid=followcount.userid)searcheduser"+
                        " where userid not in (select userid from block where blockeduserid=?) and userid not in (select blockeduserid from block where userid=?)  and userid in (select userid from follow where follower=?) and userid<?  order by userid desc limit 20"
                        param=['none',followerid,myresult[0].userid,myresult[0].userid,platform,account,followerid,myresult[0].userid]
                    }
                    connection.query(sql,param,function(err,result){
                        if(err)
                        {
                            console.log(err)
                            res.json({
                                resultCode:400,
                                persons:[]
                            })

                        }
                        else{
                            if(result.length==0)
                            {
                                res.json({
                                    resultCode:300,
                                    persons:[]
                                })
                            }
                            else
                            {
                                res.json({
                                    resultCode:200,
                                    persons:result
                                })
                            }
                        }
                    })
                }
            })

            
           
        }
    })
})
app.post('/getSearchedFollowingPerson',verifyToken,(req,res)=>{
    var nickname=req.body.nickname
    var lastuserid=req.body.lastuserid
    nickname="%"+nickname+"%"
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                persons:[]
            })
        })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var param=[platform,account]
          
            var getmyid="select *from user where platform=? and account=?"
            var sql=""
            connection.query(getmyid,param,function(err,myresult){
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    if(lastuserid==undefined)
                    {
                        sql="select *from(select user.userid,nickname,gender,if(isnull(profileimage),?,profileimage) as profileimage,if(isnull(myfollow.follower),0,1) as following,if(isnull(followcount.followingcount),0,followcount.followingcount) as followingcount from"+
                        " user left outer join (select *from follow where follower=?) myfollow on user.userid=myfollow.userid"+
                        " left outer join (select userid,count(*) as followingcount from follow group by userid) followcount on user.userid=followcount.userid)searcheduser"+
                        " where userid not in (select userid from block where blockeduserid=?) and userid not in (select blockeduserid from block where userid=?) and userid in (select userid from follow where follower=?) and nickname like ? order by userid desc limit 20"
                        param=['none',myresult[0].userid,myresult[0].userid,myresult[0].userid,myresult[0].userid,nickname]
                    }
                    else{
                        sql="select *from(select user.userid,nickname,gender,if(isnull(user.profileimage),?,user.profileimage) as profileimage,if(isnull(myfollow.follower),0,1) as following,if(isnull(followcount.followingcount),0,followcount.followingcount) as followingcount from"+
                        " user left outer join (select *from follow where follower=?) myfollow on user.userid=myfollow.userid"+
                        " left outer join (select userid,count(*) as followingcount from follow group by userid) followcount on user.userid=followcount.userid)searcheduser"+
                        " where userid not in (select userid from block where blockeduserid=?) and userid not in (select blockeduserid from block where userid=?) and userid in (select userid from follow where follower=?) and userid<? and nickname like ? order by userid desc limit 20"
                        param=['none',myresult[0].userid,myresult[0].userid,myresult[0].userid,myresult[0].userid,myresult[0].userid,nickname]
                    }
                    connection.query(sql,param,function(err,result){
                        if(err)
                        {
                            console.log(err)
                            res.json({
                                resultCode:400,
                                persons:[]
                            })

                        }
                        else{
                            if(result.length==0)
                            {
                                res.json({
                                    resultCode:300,
                                    persons:[]
                                })
                            }
                            else
                            {
                                res.json({
                                    resultCode:200,
                                    persons:result
                                })
                            }
                        }
                    })
                }
            })

            
           
        }
    })
})
app.post('/getSearchedPerson',verifyToken,(req,res)=>{
    var nickname=req.body.nickname
    var lastuserid=req.body.lastuserid
    nickname="%"+nickname+"%"
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                persons:[]
            })
            })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var param=[platform,account]
          
            var getmyid="select *from user where platform=? and account=?"
            var sql=""
            connection.query(getmyid,param,function(err,myresult){
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    if(lastuserid==undefined)
                    {
                        sql="select *from(select user.userid,nickname,gender,if(isnull(profileimage),?,profileimage) as profileimage,if(isnull(myfollow.follower),0,1) as following,if(isnull(followcount.followingcount),0,followcount.followingcount) as followingcount from"+
                        " user left outer join (select *from follow where follower=?) myfollow on user.userid=myfollow.userid"+
                        " left outer join (select userid,count(*) as followingcount from follow group by userid) followcount on user.userid=followcount.userid)searcheduser"+
                        " where userid not in (select userid from block where blockeduserid=?) and userid not in (select blockeduserid from block where userid=?) and nickname like ? order by userid desc limit 20"
                        param=['none',myresult[0].userid,myresult[0].userid,myresult[0].userid,nickname]
                    }
                    else{
                        sql="select *from(select user.userid,nickname,gender,if(isnull(user.profileimage),?,user.profileimage) as profileimage,if(isnull(myfollow.follower),0,1) as following,if(isnull(followcount.followingcount),0,followcount.followingcount) as followingcount from"+
                        " user left outer join (select *from follow where follower=?) myfollow on user.userid=myfollow.userid"+
                        " left outer join (select userid,count(*) as followingcount from follow group by userid) followcount on user.userid=followcount.userid)searcheduser"+
                        " where userid not in (select userid from block where blockeduserid=?) and userid not in (select blockeduserid from block where userid=?) and userid<? and nickname like ? order by userid desc limit 20"
                        param=['none',myresult[0].userid,myresult[0].userid,myresult[0].userid,lastuserid,nickname]
                    }
                    connection.query(sql,param,function(err,result){
                        if(err)
                        {
                            console.log(err)
                            res.json({
                                resultCode:400,
                                persons:[]
                            })

                        }
                        else{
                            if(result.length==0)
                            {
                                res.json({
                                    resultCode:300,
                                    persons:[]
                                })
                            }
                            else
                            {
                                res.json({
                                    resultCode:200,
                                    persons:result
                                })
                            }
                        }
                    })
                }
            })

            
           
        }
    })
})
app.post('/getPopularTag',verifyToken,(req,res)=>{
    
    //var platform=req.body.platform
    //var account=req.body.account
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                posts:[]
            })
        })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var param=[platform,account]
            var sql="select toptags.tagname,toptags.count,if(isnull(mytags.account),0,1) as isLiked from (select tagname,count(*) as count "+
            "from posttag group by tagname having count>0 ) toptags left outer join (select *from favoritetags where platform=? and account=?) "+
            "mytags on toptags.tagname=mytags.tagname order by count desc limit 10"
            connection.query(sql,param,function(err,result){
                if(err)
                {
                    res.json({
                        resultCode:100,
                        tags:[]
                    })
                }
                else{
                    if(result && result.length)
                    {
                        res.json({
                            resultCode:200,
                            tags:result
                        
                        })
                    }
                    else{
                        res.json({
                            resultCode:100,
                            tags:[]
                        })
                        
        
                    } 
                }
            })
        }
     })
 


})
app.post('/getpolloptions',verifyToken,(req,res)=>{
    var postid=req.body.postid

    var getpoll='select optionid,choicetext from polloption where postid=? order by optionid asc'

    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                tags:[]
            })
        })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var param=[platform,account]
            var getmy='select *from user where platform=? and account=?'
            connection.query(getmy,[platform,account],function(err,myresult){
                if(err)
                {
                    console.log('getmy err')
                }
                else{
                    var checkpolled='select *from vote where userid=? and postid=?'
                    connection.query(checkpolled,[myresult[0].userid,postid],function(err,result){
                        if(err)
                        {
                            console.log('checkpolled err')
                        }
                        else{
                            if(result.length==0)
                            {
                                connection.query(getpoll,postid,function(err,result){
                                    if(err)
                                    {
                                        console.log('getpollerr')
                            
                                    }
                                    else{
                                        res.json({
                                            resultCode:200,
                                            polloptions:result
                                        })
                                    }
                                })
                              
                            }
                            else{
                                res.json({
                                    resultCode:300,
                                    polloptions:[]
                                })
                            }
                        }
                    })
                   
                }
            })
        }
    })
    
})
app.post('/getFavoriteTag',verifyToken,(req,res)=>{
    //var platform=req.body.platform
   //var account=req.body.account
   jwt.verify(req.token,'secretkey',(err,authData)=>{
    if(err)
    {
        deleteToken(req.token,function(){
        res.json({
            resultCode:505,
            tags:[]
        })
    })

    }
    else
    {
        var platform=authData.user.platform
        var account=authData.user.account
        var param=[platform,account]
        console.log(param)
        var sql='select tagname from favoritetags where platform=? and account=?'
        connection.query(sql,param,function(err,result){
            if(err)
            {
                console.log(err)
            }
            else{
                if(result && result.length)
                {
                    res.json({
                        resultCode:200,
                        tags:result
                    
                    })
                }
                else{
                    res.json({
                        resultCode:100,
                        tags:[]
                    })
    
                } 
            }
        })
    }
    })
   

})
app.post('/getTagLiked',verifyToken,(req,res)=>{
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
           console.log('authError occured')
           deleteToken(req.token,function(){
           res.json({
            resultCode:505,
            value:1
        })
    })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var tagname=req.body.tagname
            var param=[tagname,account,platform]
            var sql='select *from favoritetags where tagname=? and account=? and platform=?'
            connection.query(sql,param,function(err,result){
                if(err)
                {
                    console.log(err)
                }
                else{
                    if(result.length==0)
                    {
                        res.json({
                            resultCode:200,
                            value:0
                        })
                    }
                    else
                    {
                        res.json({
                            resultCode:200,
                            value:1
                        })
                    }
                }
        })
        }
    })
 
})
app.post('/getSearchedTag',verifyToken,(req,res)=>{
    var tagname=req.body.tagname
    tagname="%"+tagname+"%"

    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                tags:[]
            })
        })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var param=[platform,account,tagname]
            var sql="select tags.tagname,tags.count,if(isnull(mytags.account),0,1) as isLiked from (select tagname,count(*) as count "+
            "from posttag group by tagname) tags left outer join (select tagname as tgname,platform,account from favoritetags where platform=? and account=?) "+
            "mytags on tags.tagname=mytags.tgname where tagname like ?"
            connection.query(sql,param,function(err,result){
                if(err)
                {
                    console.log(err)
                }
                else{
                    if(result && result.length)
                    {
                    
                        res.json({
                            resultCode:200,
                            tags:result
                        
                        })
                    }
                    else{
                       
                        res.json({
                            resultCode:100,
                            tags:[]
                        })
        
                    } 
                }
            })
        }
  })
 


})
app.post('/getHotContents',verifyToken,(req,res)=>{
    var postnum=req.body.lastpostnum
    var posthot=req.body.lastposthot
    var latitude=req.body.latitude
    var longitude=req.body.longitude
    var limit=req.body.limit
    var type=req.body.type
    var query=""
    var param=[]
    var getmy='select *from user where platform=? and account=?'
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                posts:[]
            })
        })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            connection.query(getmy,[platform,account],function(err,myresult){
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    var queryStr=''
                    var queryparam=''
                    if(type=='IMAGE')
                    {
                        queryStr="and not image=?"
                        queryparam='NONE'
                    }
                    else if(type=='AUDIO')
                    {
                        queryStr="and not audio=?"
                        queryparam='NONE'
                    }
                    else if(type=='VOTE'){
                        queryStr="and not vote=?"
                        queryparam='none'
                    }
                    console.log(postnum)
                
                    if(latitude==undefined)
                    {
                        if(postnum==undefined)
                        {
                            param=[myresult[0].userid,myresult[0].userid,queryparam,Number(limit)]
                            query="select *from(select post.postnum,post.postid,post.userid,post.vote,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                            +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,ifnull(vote.votecount,0) as votecount from post left outer"
                            +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                            " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                            " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                            " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                            " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id)hot"+
                            " where userid not in (select userid from block where blockeduserid=?) and userid not in (select blockeduserid from block where userid=?)"+
                            queryStr+"order by commentcount+likecount+votecount desc,postnum desc limit ?"
                        }
                        else
                        {
                 param=[posthot,posthot,postnum,myresult[0].userid,myresult[0].userid,queryparam,Number(limit)]
                            query="select *from(select post.postnum,post.vote,post.postid,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                            +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,ifnull(vote.votecount,0) as votecount from post left outer"
                            +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                            " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                            " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                            " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
        
                            " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id)hot"+
                            " where (commentcount+likecount<? or (commentcount+likecount=? and postnum<?)) and userid not in (select userid from block where blockeduserid=?) and userid not in (select blockeduserid from block where userid=?)"+
                            queryStr+"order by likecount+commentcount+votecount desc,postnum desc limit ?"
                        }
                    }
                    else
                    {
                        if(postnum==undefined)
                        {
                            param=[latitude,longitude,latitude,myresult[0].userid,myresult[0].userid,queryparam,Number(limit)]
                            query="select * from(select post.postnum,post.vote,post.postid,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                            +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,if(isnull(post.latitude),-100.0,(6371*acos(cos(radians(?))*cos(radians(post.latitude))*cos"+
                            "(radians(post.longitude)-radians(?))+sin(radians(?))*sin(radians(post.latitude))))) as distance,ifnull(vote.votecount,0) as votecount from post left outer"
                            +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                            " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                            " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                            " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                            " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id)hot "+
                            " where userid not in (select userid from block where blockeduserid=?) and userid not in (select blockeduserid from block where userid=?)"+
                             queryStr+" order by likecount+commentcount+votecount desc,postnum desc limit ?"
                        }
                        else
                        {
                            param=[latitude,longitude,latitude,posthot,posthot,postnum,myresult[0].userid,myresult[0].userid,queryparam,Number(limit)]
                            
                            query="select *from(select post.postnum,post.vote,post.postid,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                            +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,if(isnull(post.latitude),-100.0,(6371*acos(cos(radians(?))*cos(radians(post.latitude))*cos"+
                            "(radians(post.longitude)-radians(?))+sin(radians(?))*sin(radians(post.latitude))))) as distance,ifnull(vote.votecount,0) as votecount from post left outer"
                            +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                            " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                            " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                            " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                            " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id)hot "+
                            " where (commentcount+likecount<? or (commentcount+likecount=? and postnum<?)) and userid not in (select userid from block where blockeduserid=?) and userid not in (select blockeduserid from block where userid=?)"+
                            queryStr+" order by likecount+commentcount+votecount desc,postnum desc limit ?"
                        }
                    }
                            console.log(param)
                            console.log(query)
                     connection.query(query,param,function(err,result){
                        if(err)
                        {
                            console.log(err)
                        }
                        else
                        {
                            if(result && result.length)
                            {
                                console.log(result)
                                console.log(result[0].hot)
                                res.json({
                                    resultCode:200,
                                    posts:result
                                
                                })
                            }
                            else{
                        
                                res.json({
                                    resultCode:100,
                                    posts:[]
                                })
                
                            } 
                        }
                    })
                }
            })
        }
        })
})
app.post('/getHotImages',verifyToken,(req,res)=>{
    var postnum=req.body.lastpostnum
    var posthot=req.body.lastposthot
    var latitude=req.body.latitude
    var longitude=req.body.longitude
    var limit=req.body.limit
    var query=""
    var param=[]
    var getmy='select *from user where platform=? and account=?'
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                posts:[]
            })
        })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            connection.query(getmy,[platform,account],function(err,myresult){
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    console.log(postnum)
                
                    if(latitude==undefined)
                    {
                        if(postnum==undefined)
                        {
                            param=[myresult[0].userid,myresult[0].userid,'NONE',Number(limit)]
                            query="select *from(select post.postnum,post.postid,post.userid,post.vote,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                            +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,ifnull(vote.votecount,0) as votecount from post left outer"
                            +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                            " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                            " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                            " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                            " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id)hot"+
                            
                            " where userid not in (select userid from block where blockeduserid=?) and userid not in (select blockeduserid from block where userid=?) and not image=? order by commentcount+likecount+votecount desc,postnum desc limit ?"
                        }
                        else
                        {
                 param=[posthot,posthot,postnum,myresult[0].userid,myresult[0].userid,'NONE',Number(limit)]
                            query="select *from(select post.postnum,post.vote,post.postid,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                            +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,ifnull(vote.votecount,0) as votecount from post left outer"
                            +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                            " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                            " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                            " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
        
                            " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id)hot"+
                            " where (commentcount+likecount<? or (commentcount+likecount=? and postnum<?)) and userid not in (select userid from block where blockeduserid=?) and userid not in (select blockeduserid from block where userid=?) and not image=? order by likecount+commentcount+votecount desc,postnum desc limit ?"
                        }
                    }
                    else
                    {
                        if(postnum==undefined)
                        {
                            param=[latitude,longitude,latitude,myresult[0].userid,myresult[0].userid,'NONE',Number(limit)]
                            query="select * from(select post.postnum,post.vote,post.postid,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                            +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,if(isnull(post.latitude),-100.0,(6371*acos(cos(radians(?))*cos(radians(post.latitude))*cos"+
                            "(radians(post.longitude)-radians(?))+sin(radians(?))*sin(radians(post.latitude))))) as distance,ifnull(vote.votecount,0) as votecount from post left outer"
                            +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                            " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                            " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                            " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                            " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id)hot "+
                            " where userid not in (select userid from block where blockeduserid=?) and userid not in (select blockeduserid from block where userid=?) and not image=? order by likecount+commentcount+votecount desc,postnum desc limit ?"
                        }
                        else
                        {
                            param=[latitude,longitude,latitude,posthot,posthot,postnum,myresult[0].userid,myresult[0].userid,'NONE',Number(limit)]
                            
                            query="select *from(select post.postnum,post.vote,post.postid,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                            +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,if(isnull(post.latitude),-100.0,(6371*acos(cos(radians(?))*cos(radians(post.latitude))*cos"+
                            "(radians(post.longitude)-radians(?))+sin(radians(?))*sin(radians(post.latitude))))) as distance,ifnull(vote.votecount,0) as votecount from post left outer"
                            +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                            " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                            " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                            " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                            " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id)hot "+
                            " where (commentcount+likecount<? or (commentcount+likecount=? and postnum<?)) and userid not in (select userid from block where blockeduserid=?) and userid not in (select blockeduserid from block where userid=?) and not image=? order by likecount+commentcount+votecount desc,postnum desc limit ?"
                        }
                    }
                            console.log(param)
                            console.log(query)
                     connection.query(query,param,function(err,result){
                        if(err)
                        {
                            console.log(err)
                        }
                        else
                        {
                            if(result && result.length)
                            {
                                console.log(result)
                                console.log(result[0].hot)
                                res.json({
                                    resultCode:200,
                                    posts:result
                                
                                })
                            }
                            else{
                        
                                res.json({
                                    resultCode:100,
                                    posts:[]
                                })
                
                            } 
                        }
                    })
                }
            })
        }
        })
})
app.post('/getHotPosts',verifyToken,(req,res)=>{
    
    //var platform=req.body.platform
    //var account=req.body.account
    var postnum=req.body.lastpostnum
    var posthot=req.body.lastposthot
    var latitude=req.body.latitude
    var longitude=req.body.longitude
    var limit=req.body.limit
    var query=""
    var param=[]
    var getmy='select *from user where platform=? and account=?'
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                posts:[]
            })
        })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            connection.query(getmy,[platform,account],function(err,myresult){
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    console.log(postnum)
                
                    if(latitude==undefined)
                    {
                        if(postnum==undefined)
                        {
                            param=[myresult[0].userid,myresult[0].userid,Number(limit)]
                            query="select *from(select post.postnum,post.postid,post.userid,post.vote,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                            +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,ifnull(vote.votecount,0) as votecount from post left outer"
                            +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                            " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                            " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                            " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                            " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id)hot"+
                            
                            " where userid not in (select userid from block where blockeduserid=?) and userid not in (select blockeduserid from block where userid=?) order by commentcount+likecount+votecount desc,postnum desc limit ?"
                        }
                        else
                        {
                 param=[posthot,posthot,postnum,myresult[0].userid,myresult[0].userid,Number(limit)]
                            query="select *from(select post.postnum,post.vote,post.postid,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                            +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,ifnull(vote.votecount,0) as votecount from post left outer"
                            +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                            " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                            " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                            " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
        
                            " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id)hot"+
                            " where (commentcount+likecount<? or (commentcount+likecount=? and postnum<?)) and userid not in (select userid from block where blockeduserid=?) and userid not in (select blockeduserid from block where userid=?) order by likecount+commentcount+votecount desc,postnum desc limit ?"
                        }
                    }
                    else
                    {
                        if(postnum==undefined)
                        {
                            param=[latitude,longitude,latitude,myresult[0].userid,myresult[0].userid,Number(limit)]
                            query="select * from(select post.postnum,post.vote,post.postid,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                            +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,if(isnull(post.latitude),-100.0,(6371*acos(cos(radians(?))*cos(radians(post.latitude))*cos"+
                            "(radians(post.longitude)-radians(?))+sin(radians(?))*sin(radians(post.latitude))))) as distance,ifnull(vote.votecount,0) as votecount from post left outer"
                            +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                            " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                            " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                            " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                            " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id)hot "+
                            " where userid not in (select userid from block where blockeduserid=?) and userid not in (select blockeduserid from block where userid=?) order by likecount+commentcount+votecount desc,postnum desc limit ?"
                        }
                        else
                        {
                            param=[latitude,longitude,latitude,posthot,posthot,postnum,myresult[0].userid,myresult[0].userid,Number(limit)]
                            
                            query="select *from(select post.postnum,post.vote,post.postid,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                            +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,if(isnull(post.latitude),-100.0,(6371*acos(cos(radians(?))*cos(radians(post.latitude))*cos"+
                            "(radians(post.longitude)-radians(?))+sin(radians(?))*sin(radians(post.latitude))))) as distance,ifnull(vote.votecount,0) as votecount from post left outer"
                            +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                            " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                            " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                            " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                            " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id)hot "+
                            " where (commentcount+likecount<? or (commentcount+likecount=? and postnum<?)) and userid not in (select userid from block where blockeduserid=?) and userid not in (select blockeduserid from block where userid=?) order by likecount+commentcount+votecount desc,postnum desc limit ?"
                        }
                    }
                            console.log(param)
                            console.log(query)
                     connection.query(query,param,function(err,result){
                        if(err)
                        {
                            console.log(err)
                        }
                        else
                        {
                            if(result && result.length)
                            {
                                console.log(result)
                                console.log(result[0].hot)
                                res.json({
                                    resultCode:200,
                                    posts:result
                                
                                })
                            }
                            else{
                        
                                res.json({
                                    resultCode:100,
                                    posts:[]
                                })
                
                            } 
                        }
                    })
                }
            })
        }
        })
   
  
})
app.post('/getTagHotPosts',verifyToken,(req,res)=>{
    var tagname=req.body.tagname
    var postnum=req.body.lastpostnum
    var posthot=req.body.lastposthot
    var latitude=req.body.latitude
    var longitude=req.body.longitude
    var param=[]
    var query=""
    //var platform=req.body.platform
    //var account=req.body.account
var getmy='select *from user where platform=? and account=?'
    console.log(postnum)
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                posts:[]
            })
        })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            connection.query(getmy,[platform,account],function(err,myresult){
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    if(latitude==undefined)
            {
                if(postnum==undefined)
                {
                    param=[myresult[0].userid,myresult[0].userid,tagname]
                    query="select *from(select post.postnum,post.postid,post.vote,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                    +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,ifnull(vote.votecount,0) as votecount from post left outer"
                    +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                    " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                    " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                    " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                    " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id)hot"+
                    " where userid not in (select blockeduserid from block where userid=?) and userid not in (select userid from block where blockeduserid=?) having postid in (select postid from posttag where tagname=?) order by commentcount+likecount+votecount desc,postnum desc limit 20"
                }
                else
                {
         param=[posthot,posthot,postnum,myresult[0].userid,myresult[0].userid,tagname]
                    query="select *from(select post.postnum,post.postid,post.vote,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                    +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,ifnull(vote.votecount,0) as votecount from post left outer"
                    +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                    " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                    " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                    " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                    " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id)hot"+
                    " where (commentcount+likecount<? or (commentcount+likecount=? and postnum<?)) and userid not in (select blockeduserid from block where userid=?) and userid not in (select userid from block where blockeduserid=?) having postid in (select postid from posttag where tagname=?) order by commentcount+likecount+votecount desc,postnum desc limit 20"
                }
            }
            else
            {
                if(postnum==undefined)
                {
                    param=[latitude,longitude,latitude,myresult[0].userid,myresult[0].userid,tagname]
                    query="select *from(select post.postnum,post.postid,post.vote,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                    +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,if(isnull(post.latitude),-100.0,(6371*acos(cos(radians(?))*cos(radians(post.latitude))*cos"+
                    "(radians(post.longitude)-radians(?))+sin(radians(?))*sin(radians(post.latitude))))) as distance,ifnull(vote.votecount,0) as votecount from post left outer"
                    +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                    " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                    " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                    " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                    " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id)hot"+
                    " where userid not in (select blockeduserid from block where userid=?) and userid not in (select userid from block where blockeduserid=?)  having postid in (select postid from posttag where tagname=?) order by commentcount+likecount+votecount desc,postnum desc limit 20"
                }
                else
                {
                    param=[latitude,longitude,latitude,posthot,posthot,postnum,myresult[0].userid,myresult[0].userid,tagname]
                    query="select *from(select post.postnum,post.postid,post.vote,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                    +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,if(isnull(post.latitude),-100.0,(6371*acos(cos(radians(?))*cos(radians(post.latitude))*cos"+
                    "(radians(post.longitude)-radians(?))+sin(radians(?))*sin(radians(post.latitude))))) as distance,ifnull(vote.votecount,0) as votecount from post left outer"
                    +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                    " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                    " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                    " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                    " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id)hot"+
                    " where (commentcount+likecount<? or (commentcount+likecount=? and postnum<?)) and userid not in (select blockeduserid from block where userid=?) and userid not in (select userid from block where blockeduserid=?) having postid in (select postid from posttag where tagname=?) order by commentcount+likecount+votecount desc,postnum desc limit 20"
                }
            }
             connection.query(query,param,function(err,result){
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    if(result && result.length)
                    {
                        res.json({
                            resultCode:200,
                            posts:result
                        
                        })
                    }
                    else{
                        res.json({
                            resultCode:100,
                            posts:[]
                        })
        
                    } 
                }
            })
            }
        
        })
        }
        })
  
    
})
app.post('/getmyPosts',verifyToken,(req,res)=>{
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
        console.log('인증오류발생')
        deleteToken(req.token,function(){
        res.json({
            resultCode:505,
            posts:result
        
        })
    })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var postnum=req.body.lastpostnum
            var postdate=req.body.lastpostdate
        
            var param=[]
            var query=""
            var getmy='select *from user where platform=? and account=?'
        
            connection.query(getmy,[platform,account],function(err,myresult){
                if(err)
                {
                    console.log(err)
                }
                else
                {                 
                        if(postnum==undefined)
                        {
  
                            param=[myresult[0].userid,myresult[0].userid,platform,account]
                            query="select post.postnum,post.vote,post.postid,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                            +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,ifnull(vote.votecount,0) as votecount "+
                            " from post left outer"
                            +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                            " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                            " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                            " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id"+
                            " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                            " where userid not in (select blockeduserid from block where userid=?) and userid not in (select userid from block where blockeduserid=?) and post.platform=? and post.account=? order by date desc,postnum desc limit 20"
                        }
                        else
                        {
                            param=[postdate,postdate,postnum,myresult[0].userid,myresult[0].userid,platform,account]
                            query="select post.postnum,post.vote,post.postid,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                            +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,ifnull(vote.votecount,0) as votecount "+
                            " from post left outer"
                            +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                            " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                            " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                            " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id"+
                            " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                            " where (date<? or (date=? and postnum<?)) and userid not in (select userid from block where blockeduserid=?) and userid not in (select blockeduserid from block where userid=?) and post.platform=? and post.account=? order by date desc,postnum desc limit 20"
                
                        }
                
                
                    connection.query(query,param,function(err,result){
                        if(err)
                        {
                            console.log(err)
                        }
                        else
                        {
                            if(result && result.length)
                            {
                                res.json({
                                    resultCode:200,
                                    posts:result
                                
                                })
                            }
                            else{
                                res.json({
                                    resultCode:100,
                                    posts:[]
                                })
                
                            } 
                        }
                    })                  
                }
            })       
        }
   })
  
   

})
app.post('/getBookmarkedPosts',verifyToken,(req,res)=>{
   // var platform=req.body.platform
   // var account=req.body.account
   jwt.verify(req.token,'secretkey',(err,authData)=>{
    if(err)
    {
    console.log('인증오류발생')
    deleteToken(req.token,function(){
    res.json({
        resultCode:505,
        posts:result
    
    })
})
    }
    else
    {
        var platform=authData.user.platform
        var account=authData.user.account
        var postnum=req.body.lastpostnum
        var postdate=req.body.lastpostdate
        var latitude=req.body.latitude
        var longitude=req.body.longitude
        var param=[]
        var query=""
        var getmy='select *from user where platform=? and account=?'
    
        connection.query(getmy,[platform,account],function(err,myresult){
            if(err)
            {
                console.log(err)
            }
            else
            {
                if(latitude==undefined)
                {
                    if(postnum==undefined)
                    {
                        param=[myresult[0].userid,myresult[0].userid,platform,account]
                        query="select post.postnum,post.vote,post.postid,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                        +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,ifnull(vote.votecount,0) as votecount from post left outer"
                        +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                        " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                        " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                        " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id"+
                        " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                        " where userid not in (select blockeduserid from block where userid=?) and userid not in (select userid from block where blockeduserid=?) and post.postid in (select postid from bookmark where platform=? and account=?) order by date desc,postnum desc limit 20"
                    }
                    else
                    {
                        param=[postdate,postdate,postnum,myresult[0].userid,myresult[0].userid,platform,account]
                        query="select post.postnum,post.vote,post.postid,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                        +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,ifnull(vote.votecount,0) as votecount from post left outer"
                        +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                        " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                        " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                        " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id"+
                        " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                        " where (date<? or (date=? and postnum<?)) and userid not in (select blockeduserid from block where userid=?) and userid not in (select userid from block where blockeduserid=?) and post.postid in (select postid from bookmark where platform=? and account=?) order by date desc,postnum desc limit 20"
                    
                    }
                }
                else
                {
                    if(postnum==undefined)
                    {
                        param=[latitude,longitude,latitude,myresult[0].userid,myresult[0].userid,platform,account]
                        query="select post.postnum,post.vote,post.postid,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                        +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,if(isnull(post.latitude),-100.0,(6371*acos(cos(radians(?))*cos(radians(post.latitude))*cos"+
                        "(radians(post.longitude)-radians(?))+sin(radians(?))*sin(radians(post.latitude))))) as distance,ifnull(vote.votecount,0) as votecount from post left outer"
                        +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                        " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                        " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                        " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id"+
                        " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                        " where userid not in (select blockeduserid from block where userid=?) and userid not in (select userid from block where blockeduserid=?) and post.postid in (select postid from bookmark where platform=? and account=?) order by date desc,postnum desc limit 20"
                    }
                    else
                    {
                        param=[latitude,longitude,latitude,postdate,postdate,postnum,myresult[0].userid,myresult[0].userid,platform,account]
                        query="select post.postnum,post.vote,post.postid,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                        +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,if(isnull(post.latitude),-100.0,(6371*acos(cos(radians(?))*cos(radians(post.latitude))*cos"+
                        "(radians(post.longitude)-radians(?))+sin(radians(?))*sin(radians(post.latitude))))) as distance,ifnull(vote.votecount,0) as votecount from post left outer"
                        +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                        " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                        " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                        " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id"+
                        " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                        " where (date<? or (date=? and postnum<?)) and userid not in (select userid from block where blockeduserid=?) and userid not in (select blockeduserid from block where userid=?) and post.postid in (select postid from bookmark where platform=? and account=?) order by date desc,postnum desc limit 20"
            
                    }
            
                }
                connection.query(query,param,function(err,result){
                    if(err)
                    {
                        console.log(err)
                    }
                    else
                    {
                        if(result && result.length)
                        {
                            res.json({
                                resultCode:200,
                                posts:result
                            
                            })
                        }
                        else{
                            res.json({
                                resultCode:100,
                                posts:[]
                            })
            
                        } 
                    }
                })               
            }
        })
    }
})
  

   

})
app.post('/getFollowingPosts',verifyToken,(req,res)=>{
    //var platform=req.body.platform
    //var account=req.body.account
    var postnum=req.body.lastpostnum
    var postdate=req.body.lastpostdate
    var latitude=req.body.latitude
    var longitude=req.body.longitude
    var param=[]
    var query=""
    var getmy='select *from user where platform=? and account=?'
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                posts:[]
            })
        })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            connection.query(getmy,[platform,account],function(err,myresult){
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    if(latitude==undefined)
                    {
                        if(postnum==undefined)
                        {
                            param=[myresult[0].userid,myresult[0].userid,platform,account,""]
                            query="select post.postnum,post.postid,post.vote,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                            +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,ifnull(vote.votecount,0) as votecount from post left outer"
                            +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                            " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                            " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                            " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id"+
                            " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                            " where userid not in (select blockeduserid from block where userid=?) and userid not in (select userid from block where blockeduserid=?) and userid in (select userid from follow where platform=? and account=?) and anonymous=? order by date desc,postnum desc limit 20"
                        }
                        else
                        {
                            param=[postdate,postdate,postnum,myresult[0].userid,myresult[0].userid,platform,account,""]
                            query="select post.postnum,post.postid,post.vote,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                            +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,ifnull(vote.votecount,0) as votecount from post left outer"
                            +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                            " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                            " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                            " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id"+
                            " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                            " where (date<? or (date=? and postnum<?)) and userid not in (select blockeduserid from block where userid=?) and userid not in (select userid from block where blockeduserid=?) and userid in (select userid from follow where platform=? and account=?)  and anonymous=?  order by date desc,postnum desc limit 20"
                        
                        }
                    }
                    else
                    {
                        if(postnum==undefined)
                        {
                            param=[latitude,longitude,latitude,myresult[0].userid,myresult[0].userid,platform,account,""]
                            query="select post.postnum,post.postid,post.userid,post.vote,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                            +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,if(isnull(post.latitude),-100.0,(6371*acos(cos(radians(?))*cos(radians(post.latitude))*cos"+
                            "(radians(post.longitude)-radians(?))+sin(radians(?))*sin(radians(post.latitude))))) as distance,ifnull(vote.votecount,0) as votecount from post left outer"
                            +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                            " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                            " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                            " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id"+
                            " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                            " where userid not in (select blockeduserid from block where userid=?) and userid not in (select userid from block where blockeduserid=?) and userid in (select userid from follow where platform=? and account=?)  and anonymous=? order by date desc,postnum desc limit 20"
                        }
                        else
                        {
                            param=[latitude,longitude,latitude,postdate,postdate,postnum,myresult[0].userid,myresult[0].userid,platform,account,""]
                            query="select post.postnum,post.postid,post.vote,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                            +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,if(isnull(post.latitude),-100.0,(6371*acos(cos(radians(?))*cos(radians(post.latitude))*cos"+
                            "(radians(post.longitude)-radians(?))+sin(radians(?))*sin(radians(post.latitude))))) as distance,ifnull(vote.votecount,0) as votecount from post left outer"
                            +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                            " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                            " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                            " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id"+
                            " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                            " where (date<? or (date=? and postnum<?)) and userid not in (select userid from block where blockeduserid=?) and userid not in (select blockeduserid from block where userid=?) and userid in (select userid from follow where platform=? and account=?)  and anonymous=? order by date desc,postnum desc limit 20"
                
                        }
                
                    }
                    connection.query(query,param,function(err,result){
                        if(err)
                        {
                            console.log(err)
                        }
                        else
                        {
                            if(result && result.length)
                            {
                                res.json({
                                    resultCode:200,
                                    posts:result
                                
                                })
                            }
                            else{
                                res.json({
                                    resultCode:100,
                                    posts:[]
                                })
                
                            } 
                        }
                    })
                
                        
                    
                }
            })
        }
        })
})
app.post('/getuserPosts',verifyToken,(req,res)=>{
    //var platform=req.body.platform
    //var account=req.body.account
    var userid=req.body.userid
    var postnum=req.body.lastpostnum
    var postdate=req.body.lastpostdate
    var latitude=req.body.latitude
    var longitude=req.body.longitude
    var limit=req.body.limit
    var param=[]
    var query=""
    var getmy='select *from user where platform=? and account=?'
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                posts:[]
            })
        })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            connection.query(getmy,[platform,account],function(err,myresult){
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    if(latitude==undefined)
                    {
                        if(postnum==undefined)
                        {
                            param=[userid,"",Number(limit)]
                            query="select post.postnum,post.postid,post.vote,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                            +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,ifnull(vote.votecount,0) as votecount from post left outer"
                            +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                            " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                            " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                            " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id"+
                            " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                            " where userid=? and anonymous=? order by date desc,postnum desc limit ?"
                        }
                        else
                        {
                            param=[postdate,postdate,postnum,userid,"",Number(limit)]
                            query="select post.postnum,post.postid,post.vote,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                            +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,ifnull(vote.votecount,0) as votecount from post left outer"
                            +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                            " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                            " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                            " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id"+
                            " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                            " where (date<? or (date=? and postnum<?)) and userid=? and anonymous=? order by date desc,postnum desc limit ?"
                        
                        }
                    }
                    else
                    {
                        if(postnum==undefined)
                        {
                            param=[latitude,longitude,latitude,userid,"",Number(limit)]
                            query="select post.postnum,post.postid,post.userid,post.vote,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                            +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,if(isnull(post.latitude),-100.0,(6371*acos(cos(radians(?))*cos(radians(post.latitude))*cos"+
                            "(radians(post.longitude)-radians(?))+sin(radians(?))*sin(radians(post.latitude))))) as distance,ifnull(vote.votecount,0) as votecount from post left outer"
                            +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                            " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                            " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                            " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id"+
                            " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                            " where userid=? and anonymous=? order by date desc,postnum desc limit ?"
                        }
                        else
                        {
                            param=[latitude,longitude,latitude,postdate,postdate,postnum,userid,"",Number(limit)]
                            query="select post.postnum,post.postid,post.vote,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                            +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,if(isnull(post.latitude),-100.0,(6371*acos(cos(radians(?))*cos(radians(post.latitude))*cos"+
                            "(radians(post.longitude)-radians(?))+sin(radians(?))*sin(radians(post.latitude))))) as distance,ifnull(vote.votecount,0) as votecount from post left outer"
                            +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                            " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                            " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                            " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id"+
                            " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                            " where (date<? or (date=? and postnum<?)) and userid=? and anonymous=? order by date desc,postnum desc limit ?"
                
                        }
                
                    }
                    connection.query(query,param,function(err,result){
                        if(err)
                        {
                            console.log(err)
                        }
                        else
                        {
                            if(result && result.length)
                            {
                                res.json({
                                    resultCode:200,
                                    posts:result
                                
                                })
                            }
                            else{
                                res.json({
                                    resultCode:100,
                                    posts:[]
                                })
                
                            } 
                        }
                    })
                
                        
                    
                }
            })
        }
        })
})
app.post('/getuserContents',verifyToken,(req,res)=>{
    //var platform=req.body.platform
    //var account=req.body.account
    var userid=req.body.userid
    var postnum=req.body.lastpostnum
    var postdate=req.body.lastpostdate
    var latitude=req.body.latitude
    var longitude=req.body.longitude
    var limit=req.body.limit
    var type=req.body.type
    var param=[]
    var query=""
    var getmy='select *from user where platform=? and account=?'
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                posts:[]
            })
        })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            connection.query(getmy,[platform,account],function(err,myresult){
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    var queryStr=''
                    var queryparam=''
                    if(type=='IMAGE')
                    {
                        queryStr="and not image=?"
                        queryparam='NONE'
                    }
                    else if(type=='AUDIO')
                    {
                        queryStr="and not audio=?"
                        queryparam='NONE'
                    }
                    else if(type=='VOTE'){
                        queryStr="and not vote=?"
                        queryparam='none'
                    }
                    if(latitude==undefined)
                    {
                        if(postnum==undefined)
                        {
                         
                            param=[userid,"",queryparam,Number(limit)]
                            query="select post.postnum,post.postid,post.vote,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                            +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,ifnull(vote.votecount,0) as votecount from post left outer"
                            +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                            " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                            " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                            " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id"+
                            " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                            " where userid=? and anonymous=? "+queryStr+
                            " order by date desc,postnum desc limit ?"
                        }
                        else
                        {
                            param=[postdate,postdate,postnum,userid,"",queryparam,Number(limit)]
                            query="select post.postnum,post.postid,post.vote,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                            +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,ifnull(vote.votecount,0) as votecount from post left outer"
                            +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                            " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                            " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                            " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id"+
                            " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                            " where (date<? or (date=? and postnum<?)) and userid=? and anonymous=? "+queryStr+
                            " order by date desc,postnum desc limit ?"
                        
                        }
                    }
                    else
                    {
                        if(postnum==undefined)
                        {
                            param=[latitude,longitude,latitude,userid,"",queryparam,Number(limit)]
                            query="select post.postnum,post.postid,post.userid,post.vote,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                            +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,if(isnull(post.latitude),-100.0,(6371*acos(cos(radians(?))*cos(radians(post.latitude))*cos"+
                            "(radians(post.longitude)-radians(?))+sin(radians(?))*sin(radians(post.latitude))))) as distance,ifnull(vote.votecount,0) as votecount from post left outer"
                            +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                            " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                            " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                            " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id"+
                            " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                            " where userid=? and anonymous=? "+queryStr+
                            " order by date desc,postnum desc limit ?"
                        }
                        else
                        {
                            param=[latitude,longitude,latitude,postdate,postdate,postnum,userid,"",queryparam,Number(limit)]
                            query="select post.postnum,post.postid,post.vote,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                            +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,if(isnull(post.latitude),-100.0,(6371*acos(cos(radians(?))*cos(radians(post.latitude))*cos"+
                            "(radians(post.longitude)-radians(?))+sin(radians(?))*sin(radians(post.latitude))))) as distance,ifnull(vote.votecount,0) as votecount from post left outer"
                            +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                            " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                            " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                            " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id"+
                            " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                            " where (date<? or (date=? and postnum<?)) and userid=? and anonymous=? "+queryStr+
                            " order by date desc,postnum desc limit ?"
                
                        }
                
                    }
                    connection.query(query,param,function(err,result){
                        if(err)
                        {
                            console.log(err)
                        }
                        else
                        {
                            if(result && result.length)
                            {
                                res.json({
                                    resultCode:200,
                                    posts:result
                                
                                })
                            }
                            else{
                                res.json({
                                    resultCode:100,
                                    posts:[]
                                })
                
                            } 
                        }
                    })
                
                        
                    
                }
            })
        }
        })
})
app.post('/getNewPosts',verifyToken,(req,res)=>{
    //var platform=req.body.platform
    //var account=req.body.account
    var postnum=req.body.lastpostnum
    var postdate=req.body.lastpostdate
    var latitude=req.body.latitude
    var longitude=req.body.longitude
    var param=[]
    var query=""
    var getmy='select *from user where platform=? and account=?'
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                posts:[]
            })
        })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            connection.query(getmy,[platform,account],function(err,myresult){
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    if(latitude==undefined)
                    {
                        if(postnum==undefined)
                        {
                            param=[myresult[0].userid,myresult[0].userid]
                            query="select post.postnum,post.postid,post.vote,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                            +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,ifnull(vote.votecount,0) as votecount from post left outer"
                            +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                            " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                            " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                            " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id"+
                            " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                            " where userid not in (select blockeduserid from block where userid=?) and userid not in (select userid from block where blockeduserid=?) order by date desc,postnum desc limit 20"
                        }
                        else
                        {
                            param=[postdate,postdate,postnum,myresult[0].userid,myresult[0].userid]
                            query="select post.postnum,post.postid,post.vote,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                            +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,ifnull(vote.votecount,0) as votecount from post left outer"
                            +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                            " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                            " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                            " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id"+
                            " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                            " where (date<? or (date=? and postnum<?)) and userid not in (select blockeduserid from block where userid=?) and userid not in (select userid from block where blockeduserid=?) order by date desc,postnum desc limit 20"
                        
                        }
                    }
                    else
                    {
                        if(postnum==undefined)
                        {
                            param=[latitude,longitude,latitude,myresult[0].userid,myresult[0].userid]
                            query="select post.postnum,post.postid,post.userid,post.vote,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                            +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,if(isnull(post.latitude),-100.0,(6371*acos(cos(radians(?))*cos(radians(post.latitude))*cos"+
                            "(radians(post.longitude)-radians(?))+sin(radians(?))*sin(radians(post.latitude))))) as distance,ifnull(vote.votecount,0) as votecount from post left outer"
                            +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                            " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                            " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                            " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id"+
                            " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                            " where userid not in (select blockeduserid from block where userid=?) and userid not in (select userid from block where blockeduserid=?) order by date desc,postnum desc limit 20"
                        }
                        else
                        {
                            param=[latitude,longitude,latitude,postdate,postdate,postnum,myresult[0].userid,myresult[0].userid]
                            query="select post.postnum,post.postid,post.vote,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                            +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,if(isnull(post.latitude),-100.0,(6371*acos(cos(radians(?))*cos(radians(post.latitude))*cos"+
                            "(radians(post.longitude)-radians(?))+sin(radians(?))*sin(radians(post.latitude))))) as distance,ifnull(vote.votecount,0) as votecount from post left outer"
                            +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                            " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                            " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                            " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id"+
                            " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                            " where (date<? or (date=? and postnum<?)) and userid not in (select userid from block where blockeduserid=?) and userid not in (select blockeduserid from block where userid=?) order by date desc,postnum desc limit 20"
                
                        }
                
                    }
                    connection.query(query,param,function(err,result){
                        if(err)
                        {
                            console.log(err)
                        }
                        else
                        {
                            if(result && result.length)
                            {
                                res.json({
                                    resultCode:200,
                                    posts:result
                                
                                })
                            }
                            else{
                                res.json({
                                    resultCode:100,
                                    posts:[]
                                })
                
                            } 
                        }
                    })
                
                        
                    
                }
            })
        }
        })
})
app.post('/getTagNewPosts',verifyToken,(req,res)=>{
    var tagname=req.body.tagname
    var postnum=req.body.lastpostnum
    var postdate=req.body.lastpostdate
    var latitude=req.body.latitude
    var longitude=req.body.longitude
    var param=[]
    var query=""
    //var platform=req.body.platform
    //var account=req.body.account
var getmy='select *from user where platform=? and account=?'
jwt.verify(req.token,'secretkey',(err,authData)=>{
    if(err)
    {
        deleteToken(req.token,function(){
        res.json({
            resultCode:505,
            posts:[]
        })
    })
    }
    else
    {
        var platform=authData.user.platform
        var account=authData.user.account
        connection.query(getmy,[platform,account],function(err,myresult){
            if(err)
            {
                console.log(err)
            }
            else
            {
                if(latitude==undefined)
                {
                    if(postnum==undefined)
                    {
                        param=[myresult[0].userid,myresult[0].userid,tagname]
                        query="select post.postnum,post.vote,post.postid,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                        +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,ifnull(vote.votecount,0) as votecount from post left outer"
                        +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                        " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                        " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                        " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id"+
                        " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                        " where userid not in (select blockeduserid from block where userid=?) and userid not in (select userid from block where blockeduserid=?) having post.postid in (select postid from posttag where tagname=?) order by date desc,postnum desc limit 20"
                    }
                    else
                    {
                        param=[postdate,postdate,postnum,myresult[0].userid,myresult[0].userid,tagname]
                        query="select post.postnum,post.postid,post.vote,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                        +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,ifnull(vote.votecount,0) as votecount from post left outer"
                        +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                        " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                        " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                        " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id"+
                        " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                        " where (date<? or (date=? and postnum<?)) and userid not in (select blockeduserid from block where userid=?) and userid not in (select userid from block where blockeduserid=?) having post.postid in (select postid from posttag where tagname=?) order by date desc,postnum desc limit 20"
                    
                    }
                }
                else
                {
                    if(postnum==undefined)
                    {
                    
                        param=[latitude,longitude,latitude,myresult[0].userid,myresult[0].userid,tagname]
                        query="select post.postnum,post.postid,post.userid,post.vote,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                        +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,if(isnull(post.latitude),-100.0,(6371*acos(cos(radians(?))*cos(radians(post.latitude))*cos"+
                        "(radians(post.longitude)-radians(?))+sin(radians(?))*sin(radians(post.latitude))))) as distance,ifnull(vote.votecount,0) as votecount from post left outer"
                        +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                        " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                        " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                        " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id"+
                        " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                        " where userid not in (select blockeduserid from block where userid=?) and userid not in (select userid from block where blockeduserid=?) having post.postid in (select postid from posttag where tagname=?) order by date desc,postnum desc limit 20"
                    }
                    else
                    {
                        param=[latitude,longitude,latitude,postdate,postdate,postnum,myresult[0].userid,myresult[0].userid,tagname]
                        query="select post.postnum,post.postid,post.vote,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                        +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,if(isnull(post.latitude),-100.0,(6371*acos(cos(radians(?))*cos(radians(post.latitude))*cos"+
                        "(radians(post.longitude)-radians(?))+sin(radians(?))*sin(radians(post.latitude))))) as distance,ifnull(vote.votecount,0) as votecount from post left outer"
                        +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                        " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                        " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                        " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id"+
                        " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                        " where (date<? or (date=? and postnum<?)) and userid not in (select blockeduserid from block where userid=?) and userid not in (select userid from block where blockeduserid=?) having post.postid in (select postid from posttag where tagname=?) order by date desc,postnum desc limit 20"
            
                    }
            
                }
                connection.query(query,param,function(err,result){
                    if(err)
                    {
                        console.log(err)
                    }
                    else
                    {
                        if(result && result.length)
                        {
                            res.json({
                                resultCode:200,
                                posts:result
                            
                            })
                        }
                        else{
                            res.json({
                                resultCode:100,
                                posts:[]
                            })
            
                        } 
                    }
                })
            }
        
        })
    }
    })

   

        
    

})
app.post("/getNearPosts",verifyToken,(req,res)=>{
    //var platform=req.body.platform
    //var account=req.body.account
    var postnum=req.body.lastpostnum
    var postdate=req.body.lastpostdate
    var distancemax=req.body.distancemax
    var latitude=req.body.latitude
    var longitude=req.body.longitude
    var param=[]
    var getmy='select *from user where platform=? and account=?'
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                posts:[] 
            })
        })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            connection.query(getmy,[platform,account],function(err,myresult){
                if(err)
                {
                    console.log(err)
                }
                else
                {                   
                    param=[latitude,longitude,latitude,myresult[0].userid,myresult[0].userid,distancemax]
                    console.log(param)
                    var query="select post.postnum,post.vote,post.postid,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                    +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,(6371*acos(cos(radians(?))*cos(radians(post.latitude))*cos"+
                    "(radians(post.longitude)-radians(?))+sin(radians(?))*sin(radians(post.latitude)))) as distance,ifnull(vote.votecount,0) as votecount from post left outer"
                    +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                    " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                    " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                    " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id"+
                    " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                    " where latitude is not null and userid not in (select userid from block where blockeduserid=?) and post.userid not in (select blockeduserid from block where userid=?) having distance<=? order by date desc,postnum desc limit 20"
                    if(postnum!=undefined){
                
                        param=[latitude,longitude,latitude,postdate,postdate,postnum,myresult[0].userid,myresult[0].userid,distancemax]
                        query="select post.postnum,post.vote,post.postid,post.userid,getuser.nickname,getuser.profileimage,post.anonymous,post.text,tag.tags,post.date,post.image,"
                        +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(lik.likecount,0) as likecount,(6371*acos(cos(radians(?))*cos(radians(post.latitude))*cos"+
                        "(radians(post.longitude)-radians(?))+sin(radians(?))*sin(radians(post.latitude)))) as distance ,ifnull(vote.votecount,0) as votecount from post left outer"
                        +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                        " join (select postid,count(*) as likecount from likepost group by postid) lik on post.postid=lik.postid"+
                        " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid "+
                        " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id"+
                        " left outer join (select postid,count(*) as votecount from vote group by postid) vote on post.postid=vote.postid"+
                        " where latitude is not null and (date<? or (date=? and postnum<?)) and post.userid not in (select userid from block where blockeduserid=?) and post.userid not in (select blockeduserid from block where userid=?) having distance<=? order by date desc,postnum desc limit 20"
                
                    }
                
                    connection.query(query,param,function(err,result){
                        if(err)
                        {
                            console.log(err)
                        }
                        else
                        {
                            if(result && result.length)
                            {
                                res.json({
                                    resultCode:200,
                                    posts:result
                                
                                })
                            }
                            else{
                                res.json({
                                    resultCode:100,
                                    posts:[] 
                                })
                
                            } 
                        }
                    })
                }
            })
        

        }
        })
  
  

 
})
app.post('/deletepost',(req,res)=>{

    var postid=req.body.postid
    var deletepost='delete from post where postid=?'
    var deletelikepost='delete from likepost where postid=?'
    var deletecomments='delete from comment where postid=?'
    var deletelikecomments='delete from likecomment where commentid in (select com.commentid from (select *from comment where postid=?) as com)' 

    connection.query(deletepost,postid,function(err,result){
        if(err)
        {
            console.log(err)
            res.json({
                resultCode:400,
                value:400
            })
        }
        else
        {
            connection.query(deletelikepost,postid,function(err,result){
                if(err)
                {
                    console.log(err)
                    res.json({
                        resultCode:400,
                        value:400
                    })
                }
                else
                {
                    connection.query(deletecomments,postid,function(err,result){
                        if(err)
                        {
                            console.log(err)
                            res.json({
                                resultCode:400,
                                value:400
                            })
                        }
                        else
                        {
                            connection.query(deletelikecomments,postid,function(err,result){
                                if(err)
                                {
                                    console.log(err)
                                    res.json({
                                        resultCode:400,
                                        value:400
                                    })
                                }
                                else
                                {
                                    res.json({
                                        resultCode:200,
                                        value:200
                                    })
                                }
                            })
                        }
                    })
                }
            })
        }
    })

})
app.post('/deletecomment',(req,res)=>{
    var ref=req.body.ref
    var deletecomment='delete from comment where commentid in (select com.commentid from (select *from comment where ref=?) as com)'
    var deletecommentlike='delete from likecomment where commentid in (select com.commentid from (select *from comment where ref=?) as com)'

    connection.query(deletecomment,ref,function(err,result){
        if(err)
        {
            console.log(err)
            res.json({
                resultCode:400,
                value:400
            })
        }
        else
        {
            connection.query(deletecommentlike,ref,function(err,result){
                if(err)
                {
                    console.log(err)
                    res.json({
                        resultCode:400,
                        value:400
                    })
                }
                else
                {
                    res.json({
                        resultCode:200,
                        value:200
                    })
                }
            
            })
        }
    })

})
app.post('/deletereply',(req,res)=>{
    var commentid=req.body.commentid
    var deletereply='delete from comment where commentid=?'
    var deletecommentlike='delete from likecomment where commentid=?'

    connection.query(deletereply,commentid,function(err,result){
        if(err)
        {
            console.log(err)
            res.json({
                resultCode:400,
                value:400
            })
        }
        else
        {
            connection.query(deletecommentlike,commentid,function(err,result){
                if(err)
                {
                    console.log(err)  
                    res.json({
                        resultCode:400,
                        value:400
                    })                  
                }
                else
                {
                    res.json({
                        resultCode:200,
                        value:200
                    })
                }
            })

        }
    })


})
app.post('/blockcommentuser',verifyToken,(req,res)=>{
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            console.log('인증에러')
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                value:505
            })
        })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var anonymous=req.body.anonymous
            // var platform=req.body.platform
             //var account=req.body.account
             var blockuserid=req.body.blockuserid
             var popback=req.body.popback
             var time=timestamp()
             var getmy='select userid from user where platform=? and account=?'
             var insertblock='insert into block(userid,blockeduserid,time) values(?,?,?)'
             var param=[platform,account]
         
             connection.query(getmy,param,function(err,myresult){
                 if(err)
                 {
                     console.log(err)
                 }
                 else
                 {
                     if(anonymous=='false')
                     {
                         insertblock='insert into block(userid,blockeduserid,time,anonymous) values(?,?,?,?)'
                         param=[myresult[0].userid,blockuserid,time,0]
                     }
                     else
                     {
                         insertblock='insert into block(userid,blockeduserid,time,anonymous) values(?,?,?,?)'
                         param=[myresult[0].userid,blockuserid,time,1]
                     }
                 
                     connection.query(insertblock,param,function(err,result){
                         if(err)
                         {
                             console.log(err)
                         }
                         else
                         {
                             if(popback=='true')
                             {
                                 res.json({
                                     resultCode:300,
                                     value:300
                                 })
                             }
                             else
                             {
                                 res.json({
                                     resultCode:200,
                                     value:200
                                 })
                             }
                             
                         }
                     })
         
                 }
             })
         
        }
   })
 
})
app.post('/getBlocks',verifyToken,(req,res)=>{
    console.log('getblock')
    //var platform=req.body.platform
    //var account=req.body.account
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
        console.log('인증오류발생')
        deleteToken(req.token,function(){
        res.json({
            resultCode:505,
            blocks:[]
        })
    })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var getmy='select *from user where platform=? and account=?'
            var getmyblock='select block.userid,block.blockeduserid,block.time,block.anonymous,blocked.nickname from block left outer join (select userid,nickname from user where userid in (select blockeduserid from block where userid=?)) blocked on block.blockeduserid=blocked.userid where block.userid=?'
            connection.query(getmy,[platform,account],function(err,myresult){
                if(err)
                {
                    res.json({
                        resultCode:400,
                        blocks:[]
                    })
                    console.log(err)
                }
                else
                {
                    connection.query(getmyblock,[myresult[0].userid,myresult[0].userid],function(err,result){
                        if(err)
                        {
                            res.json({
                                resultCode:400,
                                blocks:[]
                            })
                        }
                        else
                        {
                            res.json({
                                resultCode:200,
                                blocks:result
                            })
                        }
                    })
                }
            })
        }
   })
  
})

app.post('/deleteBlock',(req,res)=>{
    var userid=req.body.userid
    var blockeduserid=req.body.blockeduserid
    var deleteblock='delete from block where userid=? and blockeduserid=?'
    connection.query(deleteblock,[userid,blockeduserid],function(err,result){
        if(err)
        {
            console.log(err)
            res.json({
                resultCode:400,
                value:400
            })
        }
        else
        {
            res.json({
                resultCode:200,
                value:200
            })
        }
    })
})
app.post('/blockpostuser',verifyToken,(req,res)=>{
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
        
            console.log('인증에러')
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                value:500
            })
        })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var anonymous=req.body.anonymous
            //var platform=req.body.platform
            //var account=req.body.account
            var blockuserid=req.body.blockuserid
            var time=timestamp()
            var getmy='select userid from user where platform=? and account=?'
            var insertblock=''
            var param=[platform,account]
          
        
            connection.query(getmy,param,function(err,myresult){
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    if(anonymous=='false')
                    {
                        insertblock='insert into block(userid,blockeduserid,time,anonymous) values(?,?,?,?)'
                        param=[myresult[0].userid,blockuserid,time,0]
                    }
                    else
                    {
                        insertblock='insert into block(userid,blockeduserid,time,anonymous) values(?,?,?,?)'
                        param=[myresult[0].userid,blockuserid,time,1]
                    }
            
                    connection.query(insertblock,param,function(err,result){
                        if(err)
                        {
                            console.log(err)
                        }
                        else
                        {
                            res.json({
                                resultCode:300,
                                value:300
                            })
                        }
                    })
        
                }
            })
        }
   })
 
  


})
app.post('/blockchatuser',verifyToken,(req,res)=>{
    console.log('blockchat')
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
        
            console.log('인증에러')
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                value:505
            })
        })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var anonymous=req.body.anonymous
            //var platform=req.body.platform
            //var account=req.body.account
            var blockuserid=req.body.blockuserid
            var time=timestamp()
            var getmy='select userid from user where platform=? and account=?'
            var insertblock=''
            var param=[platform,account]
          
        
            connection.query(getmy,param,function(err,myresult){
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    if(anonymous=='false')
                    {
                        insertblock='insert into block(userid,blockeduserid,time,anonymous) values(?,?,?,?)'
                        param=[myresult[0].userid,blockuserid,time,0]
                    }
                    else
                    {
                        insertblock='insert into block(userid,blockeduserid,time,anonymous) values(?,?,?,?)'
                        param=[myresult[0].userid,blockuserid,time,1]
                    }
            
                    connection.query(insertblock,param,function(err,result){
                        if(err)
                        {
                            console.log(err)
                        }
                        else
                        {
                            res.json({
                                resultCode:300,
                                value:300
                            })
                        }
                    })
        
                }
            })
        }
   })
 
  


})
app.post('/checkNotiUnread',verifyToken,(req,res)=>{
    //var platform=req.body.platform
    //var account=req.body.account
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
        console.log('인증오류발생')
        deleteToken(req.token,function(){
        res.json({
            resultCode:505,
            value:505
        })
    })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var query='select *from noti where platform=? and account=? and isread=0'
            var param=[platform,account]
            console.log(param)
        
            connection.query(query,param,function(err,result){
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    if(result.length==0)
                    {
                        res.json({
                            resultCode:100,
                            value:100
                        })
                    }
                    else
                    {
                        res.json({
                            resultCode:200,
                            value:200
                        })
                    }
                }
            })
        }
   })

   
})
app.post('/togglechat',verifyToken,(req,res)=>{
   // var platform=req.body.platform
   // var account=req.body.account
   jwt.verify(req.token,'secretkey',(err,authData)=>{
    if(err)
    {
        deleteToken(req.token,function(){
        res.json({
            resultCode:505,
            value:505
        })
        })
    }
    else
    {
        var platform=authData.user.platform
        var account=authData.user.account
        var toggle=req.body.toggle
        var togglechat='update user set chatreceive=? where platform=? and account=?'
    
    
        connection.query(togglechat,[toggle,platform,account],function(err,result){
            if(err)
            {
                console.log(err)
            }
            else
            {
                res.json({
                    resultCode:200,
                    value:200
                })
            }
        })
    }
})
   
})
app.post('/getmyprofile',verifyToken,(req,res)=>{
    //val resultCode:Int,
    //val profileimage:String?,
    //val nickname:String,
    //val gender:String
    
    //var platform=req.body.platform
    //var account=req.body.account
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            console.log('getmyprofile 인증 오류')
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                platform:platform,
                account:account,
                profileimage:result[0].profileimage,
                nickname:result[0].nickname,
                gender:result[0].gender
            })
        })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var getmy='select *from user where platform=? and account=?'
            connection.query(getmy,[platform,account],function(err,myresult){
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    var query="select *from(select user.userid,age,nickname,gender,profileimage,if(isnull(follower.followercount),0,follower.followercount) as followercount,if(isnull(following.followingcount),0,following.followingcount) as followingcount,"+
                    " if(isnull(userpost.postscount),0,userpost.postscount) as postscount from"+
                    " user"+
                    " left outer join (select userid,count(*) as followercount from follow group by userid) follower on user.userid=follower.userid"+
                    " left outer join (select userid,count(*) as postscount from post group by userid) userpost on user.userid=userpost.userid"+
                    " left outer join(select follower,count(*) as followingcount from follow group by follower) following on user.userid=following.follower"+
                    ")selecteduser where userid=?"
                    var userid=myresult[0].userid
                    connection.query(query,userid,function(err,result){
                        if(err)
                        {
                            console.log(err)
                        }
                        else
                        { 
                            if(result.length==0)
                            {
                                    res.json({
                                    resultCode:400,
                                    profileimage:'',
                                    nickname:'',
                                    gender:'',
                                    followercount:0,
                                    followingcount:0,
                                    postscount:0,
                                    age:0
                                    })
                            }
                         else{
                                res.json({
                                    resultCode:200,
                                    profileimage:result[0].profileimage,
                                    nickname:result[0].nickname,
                                    gender:result[0].gender,
                                    followercount:result[0].followercount,
                                    followingcount:result[0].followingcount,
                                    postscount:result[0].postscount,
                                    age:result[0].age
                                })
                            }  
          

                        }
                    })
                  
                }
            })
        }
   })
 
})
app.post('/getChatonoff',verifyToken,(req,res)=>{
    //var platform=req.body.platform
   // var account=req.body.account
   jwt.verify(req.token,'secretkey',(err,authData)=>{
    if(err)
    {
        deleteToken(req.token,function(){
        res.json({
            resultCode:505,
            value:505
        })
    })
    }
    else
    {
        var platform=authData.user.platform
        var account=authData.user.account
        var getmy='select *from user where platform=? and account=?'
    connection.query(getmy,[platform,account],function(err,result){
        if(err)
        {
            console.log(err)
            res.json({
                resultCode:400,
                value:400
            })
        }
        else
        {
            res.json({
                resultCode:200,
                value:result[0].chatreceive
            })
        }
    })
    }
})
    
})
app.post('/getNotis',verifyToken,(req,res)=>{
    //var platform=req.body.platform
    //var account=req.body.account
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
        console.log('인증오류발생')
        deleteToken(req.token,function(){
        res.json({
            resultCode:505,
            notis:[]

        })
    })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var notiid=req.body.notiid
            var date=req.body.date
        
            var query=''
            var param=[]
            if(notiid==undefined)
            {
                param=[platform,account]
                query='select *from noti where platform=? and account=? order by date desc,notiid desc limit 20 '
            }
            else
            {
                param=[platform,account,date,date,notiid]
                query='select *from (select *from noti where platform=? and account=?)notis where(date<? or (date=? and notiid<?)) order by date desc,notiid desc limit 20 '
            }
            connection.query(query,param,function(err,result){
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    if(result.length==0)
                    {
                        res.json({
                            resultCode:100,
                            notis:[]
        
                        })
                    }
                    else
                    {
                        console.log(result)
                        res.json({
                            resultCode:200,
                            notis:result
        
                        })
                    }
                }
            })
        }
   })
   
})
app.post('/togglecomment',verifyToken,(req,res)=>{
    console.log('togglecomment')
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            console.log('인증오류발생')
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                value:0
            })
        })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var isLiked=req.body.isLiked
            var commentid=req.body.commentid
            var rootcommentid=req.body.rootcommentid
            var insertcommentnoti='insert into noti(platform,account,date,type,text,postid) values(?,?,?,?,?,?)'
            var insertreplynoti='insert into noti(platform,account,date,type,text,postid,commentid) values(?,?,?,?,?,?,?)'
        
            var insertnoti=''
            var query=""
            var insertlike='insert into likecomment(commentid,platform,account) values(?,?,?)'
            var deletelike='delete from likecomment where commentid=? and platform=? and account=?'
            var findcomment='select *from comment where commentid=?'
            var param=[commentid,platform,account]
            var commentuserid=req.body.commentuserid
            var depth=req.body.depth
            var time=timestamp()
            var postid=req.body.postid
        
          
            
        
            var getuser='select *from user where userid=?'
            if(isLiked==1)
            {
                query=deletelike
            }
            else
            {
                query=insertlike
            }
            connection.query(findcomment,commentid,function(err,result){
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    if(result.length==0)
                    {
                        res.json({
                            resultCode:100,
                            value:0
                        })
                    }
                    else
                    {
                        connection.query(query,param,function(err,result){
                            if(err)
                            {
                                console.log(err)
                            }
                            else
                            {
                                if(isLiked==0&&commentuserid!=undefined)
                                {
                                    connection.query(getuser,commentuserid,function(err,userresult){
                                        if(err)
                                        {
                                            console.log(err)
                                        }
                                        else
                                        {
                                            var message=""
                                            var type=0
                                            
                                            if(depth==0)
                                            {   
                                                insertnoti=insertcommentnoti
                                                
                                                message='누군가 당신의 댓글을 좋아합니다'
                                                type=3
        
                                                param=[userresult[0].platform,userresult[0].account,time,type,message,postid]
                                            }
                                            else
                                            {
                                                insertnoti=insertreplynoti
                                               
                                                message='누군가 당신의 답글을 좋아합니다'
                                                type=4
                                                param=[userresult[0].platform,userresult[0].account,time,type,message,postid,rootcommentid]
                                            }
                                       
                                            connection.query(insertnoti,param,function(err,result){
                                                if(err)
                                                {
                                                    console.log(err)
                                                }
                                                else
                                                {
                                                 
                                                    var comid=''
                                                    if(type==4)
                                                        comid=rootcommentid
                                                    else
                                                        comid=null
                                                    const notiData = {
                                                        notiid : result.insertId,
                                                        type:type,
                                                        text:message,
                                                        date:time,
                                                        postid:postid,
                                                        commentid:comid,
                                                        isread:0
                                                      }
                                                    io.to(userresult[0].socketid).emit('updatenoti',JSON.stringify(notiData))
                                                    var payload={
                                                        data:{
                                                            title:'고민나눔',
                                                            message:message,
                                                            notitype:'favorite',
                                                            click_action:'NOTIFICATION_CLICK'
                                                        },
                                                        token:userresult[0].fcmtoken
                                                    
                                                    }
                                                    if(userresult[0].fcmtoken!="")
                                                    {
                                                        admin.messaging().send(payload)
                                                        .then(function(response){
                                                            console.log("Succesfully send message",response)
                                                        })
                                                        .catch(function(error){
                                                            console.log("Error sending message",error)
                                                        })
                                                    }
                                                }
                                            })
                                           
                                        }
                                            
                    
                                    })
                                }
                                res.json({
                                    resultCode:200,
                                    value:commentid
                                })
                            }
                        })
                    }
                }
            })
        
            
        }
   })

    


})

app.post('/report',(req,res)=>{
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
        console.log('인증오류발생')
        deleteToken(req.token,function(){
        res.json({
            resultCode:505,
            value:505
        })
    })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var postid=req.body.postid
    var commentid=req.body.commentid
    var reporttype=req.body.reporttype

    var query=""
    var param=[]
    if(commentid==undefined)
    {
        query="insert into report (postid,reporttype,platform,account) values(?,?,?,?)"
        param=[postid,reporttype,platform,account]
    }
    else
    {
        query="insert into report (commentid,reporttype,platform,account) values(?,?,?,?)"
        param=[commentid,reporttype,platform,account]
    }
    connection.query(query,param,function(err,result){
        if(err)
        {
            console.log(err)
            res.json({
                resultCode:400,
                value:400
            })
        }
        else
        {
            
            res.json({
                resultCode:200,
                value:200
            })
        }
    })
        }
   })
    

})
app.post('/getUserid',verifyToken,(req,res)=>{

    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                value:505
            })
        })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var getid='select *from user where platform=? and account=?'

            connection.query(getid,[platform,account],function(err,result){
                if(err)
                {
                    console.log(err)
                    res.json({
                        resultCode:400,
                        userid:400,
                        platform:''
                    })
                }
                else
                {
                    res.json({
                        resultCode:200,
                        userid:result[0].userid,
                        platform:platform
                    })
                }
            })
        }
 })
  
})
app.post('/getHotUsers',verifyToken,(req,res)=>{
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            console.log('인증오류발생')
            deleteToken(req.token,function(){
                res.json({
                resultCode:505,
                value:505
                 })
            })
        }
        else{
            var platform=authData.user.platform
            var account=authData.user.account
            var lastuserid=req.body.lastuserid
            var lastuserfollow=req.body.lastuserfollow
                var gethotuser=''
                var getmy='select *from user where platform=? and account=?'
               
                
                connection.query(getmy,[platform,account],function(err,myresult){
                    if(err)
                    {
                        console.log(err)
                    }
                    else{
        
                        var gethotuser=""
                        var myparam=[]
                        if(lastuserid==undefined)
                        {
                            myparam=['none',myresult[0].userid,myresult[0].userid,myresult[0].userid]
                            gethotuser="select *from(select user.userid,nickname,gender,if(isnull(profileimage),?,profileimage) as profileimage,if(isnull(myfollow.follower),0,1) as following,if(isnull(followcount.followingcount),0,followcount.followingcount) as followingcount from"+
                            " user left outer join (select *from follow where follower=?) myfollow on user.userid=myfollow.userid"+
                            " left outer join (select userid,count(*) as followingcount from follow group by userid) followcount on user.userid=followcount.userid)topuser"+
                            " where userid not in (select userid from block where blockeduserid=?) and userid not in (select blockeduserid from block where userid=?) and nickname is not null order by followingcount desc,userid desc limit 20"
                        }
                        else{
                            myparam=['none',myresult[0].userid,myresult[0].userid,myresult[0].userid,lastuserfollow,lastuserfollow,lastuserid]
                            gethotuser="select *from(select user.userid,nickname,gender,if(isnull(profileimage),?,profileimage) as profileimage,if(isnull(myfollow.follower),0,1) as following,if(isnull(followcount.followingcount),0,followcount.followingcount) as followingcount from"+
                            " user left outer join (select *from follow where follower=?) myfollow on user.userid=myfollow.userid"+
                            " left outer join (select userid,count(*) as followingcount from follow group by userid) followcount on user.userid=followcount.userid)topuser"+
                            " where userid not in (select userid from block where blockeduserid=?) and userid not in (select blockeduserid from block where userid=?) and (followingcount<? or (followingcount=? and userid<?)) and nickname is not null order by followingcount desc,userid desc limit 20"
                        }
                    
            
                        connection.query(gethotuser,myparam,function(err,result){
                            if(err)
                            {
                                console.log(err)
                                res.json({
                                    resultCode:400,
                                    persons:[]
                                })
                            }
                            else{
                                
                                if(result.length==0)
                                {
                                    res.json({
                                        resultCode:100,
                                        persons:[]
                                    })
                                }
                                else{
                                    res.json({
                                        resultCode:200,
                                        persons:result
                                    })
                                }
                                
                            }
                        })


                    }
                })
       
        }
    })
})
app.post('/postReply',verifyToken,(req,res)=>{
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
        console.log('인증오류발생')
        deleteToken(req.token,function(){
        res.json({
            resultCode:505,
            value:505
        })
    })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var ref=req.body.ref
            var postid=req.body.postid
            var commentid=req.body.commentid

            var time=timestamp()
            var anonymous=req.body.anonymous
            var text=req.body.text
            var postuserid=req.body.postuserid
            var commentuserid=req.body.commentuserid
            var insertreplynoti='insert into noti(platform,account,date,type,text,postid,commentid) values(?,?,?,?,?,?,?)'
            var insertcommentnoti='insert into noti(platform,account,date,type,text,postid) values(?,?,?,?,?,?)'
            var getmyquery='select *from user where platform=? and account=?'
            var findcomment='select *from comment where ref=?'
            var getuser='select *from user where userid=?'
           
        
            var blockquery='select *from block where (userid=? and blockeduserid=?) or (userid=? and blockeduserid=?)'
            var insertquery=''
            myqueryparam=[platform,account]
            postparam=[]
            var userfcmtoken=""
            var type=""
            var message=""
            var textsummary=""
            console.log(ref)
            textsummary=text
          
            if(text.length>22){
                textsummary=text.substr(0,20)+'...'
            }
            connection.query(findcomment,ref,function(err,result){
                if(err)
                {
                    console.log(err)
                }
                else
                {
                
                    if(result.length==0)
                    {
                        res.json({
                            resultCode:100,
                            value:100
                        })
                    }
                    else
                    {
                        connection.query(getmyquery,myqueryparam,function(err,myresult){
                            if(err)
                            {
                                console.log(err)
                            }
                            else
                            {
                                connection.query(blockquery,[postuserid,myresult[0].userid,myresult[0].userid,postuserid],function(err,blockpostresult){
                                    if(err)
                                    {
                                        console.log(err)
                                    }
                                    else
                                    {
                                        if(blockpostresult.length!=0)
                                        {
                                            res.json({
                                                resultCode:400,
                                              value:400  
                                            })
                                        }
                                        else
                                        {
                                            connection.query(blockquery,[commentuserid,myresult[0].userid,myresult[0].userid,commentuserid],function(err,blockcommentresult){
                                                if(err)
                                                {
                                                    console.log(err)
                                                }
                                                else
                                                {
                                                    if(blockcommentresult.length!=0)
                                                    {
                                                        res.json({
                                                            resultCode:500,
                                                            value:500
                                                        })
                                                    }
                                                    else{
                                                       //// 
                                                       if(anonymous=='NONE')
                                                       {
                                                        insertquery='insert into comment (ref,postid,userid,text,time,depth,platform,account,age,gender) values (?)'
                                                           postparam=[ref,postid,myresult[0].userid,text,time,1,platform,account,myresult[0].age,myresult[0].gender]
                                                       }
                                                       else
                                                       {
                                                        insertquery='insert into comment (ref,postid,userid,text,time,depth,platform,account,anonymous,age,gender) values (?)'
                                                           postparam=[ref,postid,myresult[0].userid,text,time,1,platform,account,anonymous,myresult[0].age,myresult[0].gender]
                                                       }
                                                       
                                connection.query(insertquery,[postparam],function(err,result){
                                    if(err)
                                    {
                                        console.log(err)
                                    
                                    }
                                    else
                                    {
                                        if(myresult[0].userid==commentuserid)
                                        {//내가쓴 댓글
                                            if(commentuserid!=postuserid)
                                            {//다른사람이 쓴글에서 내가쓴댓글에 달 답글인경우
                                                connection.query(getuser,postuserid,function(err,userresult){
                                                    if(err)
                                                    {
                                                        console.log(err)
                                                    }
                                                    else{
                                                        userfcmtoken=userresult[0].fcmtoken
                                                        
                                                        message='누군가 당신의 게시물에 댓글을 달았습니다\n'+'"'+textsummary+'"'
                                                        type='comment'
                                                        param=[userresult[0].platform,userresult[0].account,time,5,message,postid,commentid]
                                                        connection.query(insertreplynoti,param,function(err,result){
                                                            if(err)
                                                            {
                                                                console.log(err)
                                                            }
                                                            else
                                                            {
                                                              
                                                                const notiData = {
                                                                    notiid : result.insertId,
                                                                    type:5,
                                                                    text:message,
                                                                    date:time,
                                                                    postid:postid,
                                                                    commentid:commentid,
                                                                    isread:0
                                                                  }
                                                                        io.to(userresult[0].socketid).emit('updatenoti',JSON.stringify(notiData))
                                                                        var payload={
                                                                            data:{
                                                                                title:'고민나눔',
                                                                                message:message,
                                                                                notitype:type,
                                                                                click_action:'NOTIFICATION_CLICK'
                                                                            },
                                                                            token:userfcmtoken
                                                                        }
                                                                         
                                                                        if(userresult[0].fcmtoken!='')
                                                                        {
                                                                            admin.messaging().send(payload)
                                                                            .then(function(response){
                                                                                console.log("Succesfully send message",response)
                                                                            })
                                                                            .catch(function(error){
                                                                                console.log("Error sending message",error)
                                                                            })
                                                                        }         
                                                            }
                                                        })
                                                    }
                                                })
                                            }
                                        }
                                        else
                                        {
                                            if(myresult[0].userid==postuserid)
                                            {//내가쓴댓글이 아니지만 내가쓴글에서 답글을달경우
                                                connection.query(getuser,commentuserid,function(err,userresult){
                                                    if(err)
                                                    {
                                                        console.log(err)
                                                    }
                                                    else{
                                                        userfcmtoken=userresult[0].fcmtoken
                                                        message='누군가 당신의 댓글에 답글을 달았습니다\n'+'"'+textsummary+'"'
                                                        type='comment'
                                                        param=[userresult[0].platform,userresult[0].account,time,5,message,postid,commentid]
                                                        connection.query(insertreplynoti,param,function(err,result){
                                                            if(err)
                                                            {
                                                                console.log(err)
                                                            }
                                                            else
                                                            {
                                                               
                                                                const notiData = {
                                                                    notiid : result.insertId,
                                                                    type:5,
                                                                    text:message,
                                                                    date:time,
                                                                    postid:postid,
                                                                    commentid:commentid,
                                                                    isread:0
                                                                  }
                                                                io.to(userresult[0].socketid).emit('updatenoti',JSON.stringify(notiData))
                                                                var payload={
                                                                    data:{
                                                                        title:'고민나눔',
                                                                        message:message,
                                                                        notitype:type,
                                                                        click_action:'NOTIFICATION_CLICK'
                                                                    },
                                                                    token:userfcmtoken
                                                                }
                                                                 
                                                                if(userresult[0].fcmtoken!='')
                                                                {
                                                                    admin.messaging().send(payload)
                                                                    .then(function(response){
                                                                        console.log("Succesfully send message",response)
                                                                    })
                                                                    .catch(function(error){
                                                                        console.log("Error sending message",error)
                                                                    })
                                                                }
                                                            }
                                                        })
                                                    }
                                                })
                                            }
                                            else
                                            {
                                                //내가쓴댓글도아니고 내가쓴글도아닐때
                                                if(commentuserid==postuserid)
                                                {
                                                    //댓글쓴사람이 게시물작성자일떄
                                                    connection.query(getuser,postuserid,function(err,userresult){
                                                        if(err)
                                                        {
                                                            console.log(err)
                                                        }
                                                        else{
                                                        
                                                            userfcmtoken=userresult[0].fcmtoken
                                                        
                                                            message='누군가 당신의 댓글에 답글을 달았습니다\n'+'"'+textsummary+'"'
                                                            type='comment'
                                                            param=[userresult[0].platform,userresult[0].account,time,5,message,postid,commentid]
                                                            connection.query(insertreplynoti,param,function(err,result){
                                                                if(err)
                                                                {
                                                                    console.log(err)
                                                                }
                                                                else
                                                                {
                                                                    
                                                                const notiData = {
                                                                    notiid : result.insertId,
                                                                    type:5,
                                                                    text:message,
                                                                    date:time,
                                                                    postid:postid,
                                                                    commentid:commentid,
                                                                    isread:0
                                                                  }
                                                                    io.to(userresult[0].socketid).emit('updatenoti',JSON.stringify(notiData))
        
                                                                    var payload={
                                                                        data:{
                                                                            title:'고민나눔',
                                                                            message:message,
                                                                            notitype:type,
                                                                            click_action:'NOTIFICATION_CLICK'
                                                                        },
                                                                        token:userfcmtoken
                                                                    }
                                                                    if(userresult[0].fcmtoken!='')
                                                                    {
                                                                        admin.messaging().send(payload)
                                                                        .then(function(response){
                                                                            console.log("Succesfully send message",response)
                                                                        })
                                                                        .catch(function(error){
                                                                            console.log("Error sending message",error)
                                                                        })
                                                                    }
                                                                    
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                                else
                                                {
    
                                                    connection.query(getuser,commentuserid,function(err,userresult){
                                                        if(err)
                                                        {
                                                            console.log(err)
                                                        }
                                                        else{
                                                            userfcmtoken=userresult[0].fcmtoken
                                                            message='누군가 당신의 댓글에 답글을 달았습니다\n'+'"'+textsummary+'"'
                                                            type='comment'
                                                            param=[userresult[0].platform,userresult[0].account,time,5,message,postid,commentid]
                                                            connection.query(insertreplynoti,param,function(err,result){
                                                                if(err)
                                                                {
                                                                    console.log(err)
                                                                }
                                                                else
                                                                {
                                                                    
                                                                const notiData = {
                                                                    notiid : result.insertId,
                                                                    type:5,
                                                                    text:message,
                                                                    date:time,
                                                                    postid:postid,
                                                                    commentid:commentid,
                                                                    isread:0
                                                                  }
                                                                    io.to(userresult[0].socketid).emit('updatenoti',JSON.stringify(notiData))
                                                                    var payload={
                                                                        data:{
                                                                            title:'고민나눔',
                                                                            message:message,
                                                                            notitype:type,
                                                                            click_action:'NOTIFICATION_CLICK'
                                                                        },
                                                                        token:userresult[0].fcmtoken
                                                                    }
                                                                     
                                                                        if(userresult[0].fcmtoken!='')
                                                                        {
                                                                            admin.messaging().send(payload)
                                                                            .then(function(response){
                                                                                console.log("Succesfully send message",response)
                                                                            })
                                                                            .catch(function(error){
                                                                                console.log("Error sending message",error)
                                                                            })
                                                                        }
                                                                        
                                                                }
                                                            })
                                                        }
                                                        
                                                        
                                                    })
                                                    connection.query(getuser,postuserid,function(err,userresult){
                                                        if(err)
                                                        {
                                                            console.log(err)
                                                        }
                                                        else{
                                                            userfcmtoken=userresult[0].fcmtoken
                                                            message='누군가 당신의 게시물에 댓글을 달았습니다\n'+'"'+textsummary+'"'
                                                            type='comment'
                                                            param=[userresult[0].platform,userresult[0].account,time,5,message,postid,commentid]
                                                            connection.query(insertcommentnoti,param,function(err,result){
                                                                if(err)
                                                                {
                                                                    console.log(err)
                                                                }
                                                                else
                                                                {
                                                                    
                                                                const notiData = {
                                                                    notiid : result.insertId,
                                                                    type:5,
                                                                    text:message,
                                                                    date:time,
                                                                    postid:postid,
                                                                    commentid:commentid,
                                                                    isread:0
                                                                  }
                                                                    io.to(userresult[0].socketid).emit('updatenoti',JSON.stringify(notiData))
                                                                    var payload={
                                                                        data:{
                                                                            title:'고민나눔',
                                                                            message:message,
                                                                            notitype:type,
                                                                            click_action:'NOTIFICATION_CLICK'
                                                                        },
                                                                        token:userresult[0].fcmtoken
                                                                    }
                                                                    if(userresult[0].fcmtoken!='')
                                                                    {
                                                                        admin.messaging().send(payload)
                                                                        .then(function(response){
                                                                            console.log("Succesfully send message",response)
                                                                        })
                                                                        .catch(function(error){
                                                                            console.log("Error sending message",error)
                                                                        })
                                                                    }
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                            }
                                        }
                                           

                var getcomment="select com.commentid,com.postid,com.userid,com.text,com.ref,com.time,com.depth,com.platform,com.account,com.anonymous,getuser.nickname,getuser.profileimage,com.age,com.gender,"+
                "ifnull(lik.likecount,0) as likecount,if(isnull(mylik.account),0,1)"+
                " as commentliked from (select *from comment where commentid=?) com "+
                " left outer join(select commentid,count(*) as likecount from "+
                " likecomment group by commentid) lik on com.commentid=lik.commentid left outer join (select commentid,platform,account from likecomment"+
                " where platform=? and account=?) mylik on com.commentid=mylik.commentid"+
                " left outer join (select userid as id,nickname,profileimage from user) getuser on com.userid=getuser.id"
                                        
                                    
                                        connection.query(getcomment,[result.insertId,platform,account],function(err,getresult){
                                            if(err)
                                            {
                                                res.json({
                                                    resultCode:400,
                                                    comments:[]
                                                })
                                            }
                                            else{
                                                res.json({
                                                    resultCode:200,
                                                    comments:getresult
                                                })
                                            }
                                        })
                                      
                                        
                                    }
                                })
                                                    }
                                                }
                                            })
                                        }
                                    }
                                })
                            
                            
        
                            }
                    
                    
                        })
                    }
                }
                
            })
        }
   })
 

  
    
    
})
app.post('/postComment',verifyToken,(req,res)=>{
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                value:505
            })
        })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var postid=req.body.postid

            var time=timestamp()
            var anonymous=req.body.anonymous
            var text=req.body.text
            var blockquery='select *from block where (userid=? and blockeduserid=?) or (userid=? and blockeduserid=?)'
            var getmyquery='select *from user where platform=? and account=?'
            var findpost='select *from post where postid=?'
            var getuser='select *from user where userid=?'
            var postuserid=req.body.postuserid
            var textsummary=""
            textsummary=text
          
            if(text.length>22){
                textsummary=text.substr(0,20)+'...'
            }
           
        
            var insertquery=''
            myqueryparam=[platform,account]
            postparam=[]
            connection.query(findpost,postid,function(err,result){
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    if(result.length==0)
                    {
                        res.json({
                            resultCode:100,
                            comments:[]
                        })
                    }
                    else
                    {
                        connection.query(getmyquery,myqueryparam,function(err,result){
                            if(err)
                            {
                                console.log(err)
                            }
                            else
                            {
                                connection.query(blockquery,[result[0].userid,postuserid,postuserid,result[0].userid],function(err,blockresult){
                                    if(err){
                                        console.log(err)
                                    }
                                    else
                                    {
                                        if(blockresult.length!=0)
                                        {
                                            res.json({
                                                resultCode:400,
                                                comments:[]
                                            })
                                        }
                                        else
                                        {
                                            if(anonymous=='NONE')
                                            {
                                                insertquery='insert into comment (ref,postid,userid,text,time,depth,platform,account,age,gender) values ( (select ifnull(max(ref)+1,1) from comment b),?)'
                                                postparam=[postid,result[0].userid,text,time,0,platform,account,result[0].age,result[0].gender]
                                            }
                                            else
                                            {
                                                insertquery='insert into comment (ref,postid,userid,text,time,depth,platform,account,anonymous,age,gender) values ( (select ifnull(max(ref)+1,1) from comment b),?)'
                                                postparam=[postid,result[0].userid,text,time,0,platform,account,anonymous,result[0].age,result[0].gender]
                                            }
                                            connection.query(insertquery,[postparam],function(err,result){
                                                if(err)
                                                {
                                                    console.log(err)
                                                
                                                }
                                                else
                                                {
                    
                                                    if(postuserid!=undefined)
                                                    {
                                                        connection.query(getuser,postuserid,function(err,userresult){
                                                            if(err)
                                                            {
                                                                console.log(err)
                                                            }
                                                            else
                                                            {
                                                                var message='누군가 당신의 게시물에 댓글을 달았습니다\n'+'"'+textsummary+'"'
                                                                var param=[userresult[0].platform,userresult[0].account,time,1,message,postid]
                                                                var insertcommentnoti='insert into noti(platform,account,date,type,text,postid) values(?,?,?,?,?,?)'
                                                                connection.query(insertcommentnoti,param,function(err,result){
                                                                    if(err)
                                                                    {
                                                                        console.log(err)
                                                                    }
                                                                    else
                                                                    {
                                                                        const notiData = {
                                                                            notiid : result.insertId,
                                                                            type:1,
                                                                            text:message,
                                                                            date:time,
                                                                            postid:postid,                                 
                                                                            isread:0
                                                                          }
                                                                        io.to(userresult[0].socketid).emit('updatenoti',JSON.stringify(notiData))
                                                                        var payload={
                                                                            data:{
                                                                                title:'고민나눔',
                                                                                message:'누군가 당신의 게시물에 댓글을 달았습니다\n'+'"'+textsummary+'"',
                                                                                notitype:'comment',
                                                                                click_action:'NOTIFICATION_CLICK'
                                                                            },
                                                                            token:userresult[0].fcmtoken
                                                                        
                              
                                                                        }
                                                                        if(userresult[0].fcmtoken!='')
                                                                        {
                                                                            admin.messaging().send(payload)
                                                                            .then(function(response){
                                                                                console.log("Succesfully send message",response)
                                                                            })
                                                                            .catch(function(error){
                                                                                console.log("Error sending message",error)
                                                                            })
                                                                        }
                                                                    }
                                                                })
                                                                
                                                            }
                                                        })
                                                    }
                                                
                                                    var getcomment="select com.commentid,com.postid,com.userid,com.text,com.ref,com.time,com.depth,com.platform,com.account,com.anonymous,getuser.nickname,getuser.profileimage,com.age,com.gender,"+
                                                    "ifnull(reply.replycount,0) as replycount,ifnull(lik.likecount,0) as likecount,if(isnull(mylik.account),0,1)"+
                                                    " as commentliked from (select *from comment where commentid=?) com left outer join (select ref,count(*) as replycount from comment where"+
                                                    " depth=1 and postid=? group by ref) reply on com.ref=reply.ref left outer join(select commentid,count(*) as likecount from "+
                                                    " likecomment group by commentid) lik on com.commentid=lik.commentid left outer join (select commentid,platform,account from likecomment"+
                                                    " where platform=? and account=?) mylik on com.commentid=mylik.commentid"+
                                                    " left outer join (select userid as id,nickname,profileimage from user) getuser on com.userid=getuser.id"
                                                    
                                                
                                                    connection.query(getcomment,[result.insertId,postid,platform,account],function(err,getresult){
                                                        if(err)
                                                        {
                                                            res.json({
                                                                resultCode:400,
                                                                comments:[]
                                                            })
                                                        }
                                                        else{
                                                            res.json({
                                                                resultCode:200,
                                                                comments:getresult
                                                            })
                                                        }
                                                    })
                                                
                                                }
                                            })
                                        }
                                    }
                                })
                              
                            }
                    
                    
                        })
                    }
                }
                
            })
        }
   })
  


})
app.post('/getVoteResult',(req,res)=>{
    var postid=req.body.postid
    var getvoteresult='select polloption.optionid as oid,postid,choicetext,ifnull(vresult.votecount,0) as votecount from polloption left outer join (select optionid,count(*) as votecount from vote where postid=? group by optionid ) vresult on polloption.optionid=vresult.optionid where postid=? order by oid asc'
    connection.query(getvoteresult,[postid,postid],function(err,result){
        if(err)
        {
            console.log(err)
            res.json({
                resultCode:400,
                voteresult:[]
            })
        }
        else{
            res.json({
                resultCode:200,
                voteresult:result
            })

        }
    })
})
app.post('/vote',verifyToken,(req,res)=>{
    var postid=req.body.postid
    var optionid=req.body.optionid
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                votereesult:[]
            })
        })
        }
        else{

            var platform=authData.user.platform
            var account=authData.user.account
            var param=[platform,account]
            var getmy='select *from user where platform=? and account=?'

            connection.query(getmy,param,function(err,myresult){
                if(err)
                {
                    console.log(err)
                }
                else{
                    var vote='insert into vote (userid,optionid,postid) values(?,?,?)'
                    connection.query(vote,[myresult[0].userid,optionid,postid],function(err,result){
                        if(err)
                        {
                            console.log(err)
                        }
                        else{
                            var getvoteresult='select polloption.optionid as oid,postid,choicetext,ifnull(vresult.votecount,0) as votecount from polloption left outer join (select optionid,count(*) as votecount from vote where postid=? group by optionid ) vresult on polloption.optionid=vresult.optionid where postid=? order by oid asc'
                            connection.query(getvoteresult,[postid,postid],function(err,result){
                                if(err)
                                {
                                    console.log(err)
                                    res.json({
                                        resultCode:400,
                                        voteresult:[]
                                    })
                                }
                                else{
                                    res.json({
                                        resultCode:200,
                                        voteresult:result
                                    })
                        
                                }
                            })
                        }
                    })
                }
            })

        }
    })

})
app.post('/checkSelectedComment',verifyToken,(req,res)=>{
   
    console.log('checkselectedcomment')
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                comments:[]
            })
        })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var commentid=req.body.commentid
            var postid=req.body.postid

            var postuserid=req.body.postuserid
            var commentuserid=req.body.commentuserid
        
        
            var param=[commentid,platform,account]
        
        
            var commentquery="select *from comment where commentid=?"
            var postquery="select *from comment where postid=?"
            var query="select com.commentid,com.postid,com.userid,com.text,com.ref,com.time,com.depth,com.platform,com.account,com.anonymous,getuser.nickname,getuser.profileimage,com.age,com.gender,"+
            "ifnull(lik.likecount,0) as likecount,if(isnull(mylik.account),0,1)"+
            " as commentliked from (select *from comment where commentid=?) com "+
            "left outer join(select commentid,count(*) as likecount from "+
            " likecomment group by commentid) lik on com.commentid=lik.commentid left outer join (select commentid,platform,account from likecomment"+
            " where platform=? and account=?) mylik on com.commentid=mylik.commentid"+
            " left outer join (select userid as id,nickname,profileimage from user) getuser on com.userid=getuser.id"
        
            var getmy='select *from user where platform=? and account=?'
            var blockquery='select *from block where (userid=? and blockeduserid=?) or (userid=? and blockeduserid=?)'
            connection.query(getmy,[platform,account],function(err,myresult)
            {
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    connection.query(postquery,postid,function(err,postresult){
                        if(err)
                        {
                            console.log(err)
                        }
                        else
                        {
                            if(postresult.length!=0)
                            {
                                
                                connection.query(blockquery,[myresult[0].userid,postresult[0].userid,postresult[0].userid,myresult[0].userid],function(err,postblockresult){
                                    if(err)
                                    {
                                        
                                        console.log(err)
                                    }
                                    else
                                    {
                                        
                                        if(postblockresult.length!=0)
                                        {
                                             res.json({
                                                 resultCode:400,
                                                 comments:[]
                                             })
                                        }
                                        else
                                        {
                                            connection.query(commentquery,commentid,function(err,commentresult){
                                                if(err)
                                                {
                                                    console.log(err)
                                                }
                                                else
                                                {
                                                    if(commentresult.length!=0)
                                                    {
                                
                                                        connection.query(blockquery,[myresult[0].userid,commentresult[0].userid,commentresult[0].userid,myresult[0].userid],function(err,commentblockresult){
                                                            if(err)
                                                            {
                                                                console.log(err)
                                                            }
                                                            else
                                                            {
                                                                if(commentblockresult.length!=0)
                                                                {
                                                                    res.json({
                                                                        resultCode:500,
                                                                        comments:[]
                                                                    })
                                                                }
                                                                else{
                                                                    connection.query(query,param,function(err,result){
                                                                        if(err)
                                                                        {
                                                                            console.log(err)
                                                                        }
                                                                        else
                                                                        {
                                                                            if(result.length==0)
                                                                            {
                                                                                res.json({
                                                                                    resultCode:100,
                                                                                    comments:[]
                                                                                })
                                                                            }
                                                                            else
                                                                            {
                                                                                res.json({
                                                                                    resultCode:200,
                                                                                    comments:result
                                                                                })
                                                                            }
                                                                        }
                                                                    })
                                                                }
                                                            }
                                                        })
                                                    }
                                                    else
                                                    {
                                                        res.json({
                                                            resultCode:100,
                                                            comments:[]
                                                        })
                                                    }
                                                }
                                            })
                                        
                                        }
                                    }
                                })
                            }
                            else{
                                res.json({
                                    resultCode:100,
                                    comments:[]
                                })
                            }
                          
                        }
                    })
                   }
             })
        }
   })
  

     


})
app.post('/getReply',verifyToken,(req,res)=>{
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
        console.log('인증오류')
        deleteToken(req.token,function(){
        res.json({
            resultCode:505,
            comments:[]
        })
    })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account

    var commentid=req.body.commentid
    var time=req.body.time

    var ref=req.body.ref
    var query=""
    var param=[]
    var getmy='select *from user where platform=? and account=?'

    connection.query(getmy,[platform,account],function(err,myresult){
        if(err)
        {
            console.log(err)
        }
        else
        {
            if(commentid==undefined)
            {
                param=[ref,platform,account,myresult[0].userid,myresult[0].userid]
                query="select com.commentid,com.postid,com.userid,com.text,com.ref,com.time,com.depth,com.platform,com.account,com.anonymous,getuser.nickname,getuser.profileimage,com.age,com.gender,"+
                "ifnull(lik.likecount,0) as likecount,if(isnull(mylik.account),0,1)"+
                " as commentliked from (select *from comment where depth=1 and ref=?) com "+
                " left outer join(select commentid,count(*) as likecount from "+
                " likecomment group by commentid) lik on com.commentid=lik.commentid left outer join (select commentid,platform,account from likecomment"+
                " where platform=? and account=?) mylik on com.commentid=mylik.commentid"+
                " left outer join (select userid as id,nickname,profileimage from user) getuser on com.userid=getuser.id"+
                " where com.userid not in (select userid from block where blockeduserid=?) and com.userid not in (select blockeduserid from block where userid=?) order by com.time asc,com.commentid asc limit 20 "
            }
            else
            {
                param=[ref,platform,account,time,time,commentid,myresult[0].userid,myresult[0].userid]
                query="select com.commentid,com.postid,com.userid,com.text,com.ref,com.time,com.depth,com.platform,com.account,com.anonymous,getuser.nickname,getuser.profileimage,com.age,com.gender,"+
                "ifnull(lik.likecount,0) as likecount,if(isnull(mylik.account),0,1)"+
                " as commentliked from (select *from comment where depth=1 and ref=?) com "+
                " left outer join(select commentid,count(*) as likecount from "+
                " likecomment group by commentid) lik on com.commentid=lik.commentid left outer join (select commentid,platform,account from likecomment"+
                " where platform=? and account=?) mylik on com.commentid=mylik.commentid"+
                " left outer join (select userid as id,nickname,profileimage from user) getuser on com.userid=getuser.id"+
                " where(com.time>? or (com.time=? and com.commentid>?)) and com.userid not in (select userid from block where blockeduserid=?) and com.userid not in (select blockeduserid from block where userid=?) order by com.time asc,com.commentid asc limit 20 "
            }
            connection.query(query,param,function(err,result){
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    if(result.length==0)
                    {
                    
                        res.json({
                            resultCode:100,
                            comments:[]
                        })
                    }
                    else
                    {
                        console.log(result)
                        res.json({
                            resultCode:200,
                            comments:result
                        })
                    }
                }
            })
        }
    })
        }
   })
  
       
})
app.post('/getComment',verifyToken,(req,res)=>{
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                comments:[]
            })
        })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var commentid=req.body.commentid
    var postid=req.body.postid
    var time=req.body.time
    var getcomment=""
    var param=[]
    var getmy='select *from user where platform=? and account=?'
    console.log(commentid)
    connection.query(getmy,[platform,account],function(err,myresult){
        if(err)
        {
            console.log(err)
        }
        else
        {
            if(commentid==undefined)
    {
    
        param=[postid,postid,platform,account,myresult[0].userid,myresult[0].userid]
   
        getcomment="select com.commentid,com.postid,com.userid,com.text,com.ref,com.time,com.depth,com.platform,com.account,com.anonymous,getuser.nickname,getuser.profileimage,com.age,com.gender,"+
        "ifnull(reply.replycount,0) as replycount,ifnull(lik.likecount,0) as likecount,if(isnull(mylik.account),0,1)"+
        " as commentliked from (select *from comment where depth=0 and postid=?) com left outer join (select ref,count(*) as replycount from comment where"+
        " depth=1 and postid=? group by ref) reply on com.ref=reply.ref left outer join(select commentid,count(*) as likecount from "+
        " likecomment group by commentid) lik on com.commentid=lik.commentid left outer join (select commentid,platform,account from likecomment"+
        " where platform=? and account=?) mylik on com.commentid=mylik.commentid"+
        " left outer join (select userid as id,nickname,profileimage from user) getuser on com.userid=getuser.id"+
        " where com.userid not in (select blockeduserid from block where userid=?) and com.userid not in (select userid from block where blockeduserid=?) order by com.time asc,com.commentid asc limit 20 "
    }
    else
    {

      
        param=[postid,postid,platform,account,time,time,commentid,myresult[0].userid,myresult[0].userid]
        getcomment="select com.commentid,com.postid,com.userid,com.text,com.ref,com.time,com.depth,com.platform,com.account,com.anonymous,getuser.nickname,getuser.profileimage,com.age,com.gender,ifnull(reply.replycount,0) as replycount,ifnull(lik.likecount,0) as likecount,if(isnull(mylik.account),0,1)"+
        " as commentliked from (select *from comment where depth=0 and postid=?) com left outer join (select ref,count(*) as replycount from comment where"+
        " depth=1 and postid=? group by ref) reply on com.ref=reply.ref left outer join(select commentid,count(*) as likecount from "+
        " likecomment group by commentid) lik on com.commentid=lik.commentid left outer join (select commentid,platform,account from likecomment"+
        " where platform=? and account=?) mylik on com.commentid=mylik.commentid"+
        " left outer join (select userid as id,nickname,profileimage from user) getuser on com.userid=getuser.id"+
        " where(com.time>? or (com.time=? and com.commentid>?)) and com.userid not in (select blockeduserid from block where userid=?) and com.userid not in (select userid from block where blockeduserid=?) order by com.time asc,com.commentid asc limit 20 "
    }
    connection.query(getcomment,param,function(err,result){
        if(err)
        {
            console.log(err)
        }
        else
        {
            if(result.length==0)
            {
            
                res.json({
                    resultCode:100,
                    comments:[]
                })
            }
            else
            {
                console.log(result)
                res.json({
                    resultCode:200,
                    comments:result
                })
            }
        }
    })
	}

})
        }
   })
    
    

})
app.post('/getHotComment',verifyToken,(req,res)=>{
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                comments:[]
            })
        })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var commentid=req.body.commentid
    var postid=req.body.postid

    var likecount=req.body.likecount
    var getcomment=""
    var param=[]
    var getmy='select *from user where platform=? and account=?'
    connection.query(getmy,[platform,account],function(err,myresult){
        if(err)
        {
            console.log(err)
        }
        else
        {
            if(commentid==undefined)
            {
                param=[postid,postid,platform,account,myresult[0].userid,myresult[0].userid]
                getcomment="select com.commentid,com.postid,com.userid,com.text,com.ref,com.time,com.depth,com.platform,com.account,com.anonymous,getuser.nickname,getuser.profileimage,com.age,com.gender,ifnull(reply.replycount,0) as replycount,ifnull(lik.likecount,0) as likecount,if(isnull(mylik.account),0,1)"+
                " as commentliked from (select *from comment where depth=0 and postid=?) com left outer join (select ref,count(*) as replycount from comment where"+
                " depth=1 and postid=? group by ref) reply on com.ref=reply.ref left outer join(select commentid,count(*) as likecount from "+
                " likecomment group by commentid) lik on com.commentid=lik.commentid left outer join (select commentid,platform,account from likecomment"+
                " where platform=? and account=?) mylik on com.commentid=mylik.commentid"+
                " left outer join (select userid as id,nickname,profileimage from user) getuser on com.userid=getuser.id"+
                " where com.userid not in (select blockeduserid from block where userid=?) and com.userid not in (select userid from block where blockeduserid=?) order by likecount desc,com.commentid desc limit 20 "
        
            }
            else
            {

               
                param=[postid,postid,platform,account,myresult[0].userid,myresult[0].userid,likecount,likecount,commentid]
        
                getcomment="select com.commentid,com.postid,com.userid,com.text,com.ref,com.time,com.depth,com.platform,com.account,com.anonymous,getuser.nickname,getuser.profileimage,com.age,com.gender,ifnull(reply.replycount,0) as replycount,ifnull(lik.likecount,0) as likecount,if(isnull(mylik.account),0,1)"+
                " as commentliked from (select *from comment where depth=0 and postid=?) com left outer join (select ref,count(*) as replycount from comment where"+
                " depth=1 and postid=? group by ref) reply on com.ref=reply.ref left outer join(select commentid,count(*) as likecount from "+
                " likecomment group by commentid) lik on com.commentid=lik.commentid left outer join (select commentid,platform,account from likecomment"+
                " where platform=? and account=?) mylik on com.commentid=mylik.commentid"+
                " left outer join (select userid as id,nickname,profileimage from user) getuser on com.userid=getuser.id"+
                " where com.userid not in (select blockeduserid from block where userid=?) and com.userid not in (select userid from block where blockeduserid=?) having(likecount<? or (likecount=? and com.commentid<?)) order by likecount desc,com.commentid desc limit 20 "
        
            
            }
            connection.query(getcomment,param,function(err,result){
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    if(result.length==0)
                    {
                        res.json({
                            resultCode:100,
                            comments:[]
                        })
                    }
                    else
                    {
                        console.log(result)
                        res.json({
                            resultCode:200,
                            comments:result
                        })
                    }
                }
            })
	}

})
        }
   })
    
   
})
app.post('/readAllNoti',verifyToken,(req,res)=>{
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
        console.log('인증오류발생')
        deleteToken(req.token,function(){
        res.json({
            resultCode:505,
            value:505
        })
    })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var param=[platform,account]
            var readall='update noti set isread=1 where platform=? and account=?'
        
            connection.query(readall,param,function(err,result){
                if(err)
                {
                    console.log(err)
                    res.json({
                        resultCode:400,
                        value:400
                    })
                }
                else
                {
                    res.json({
                        resultCode:200,
                        value:200
                    })
                }
            })
        }
   })

})
app.post('/getchatrequests',verifyToken,(req,res)=>{
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                requests:[]
            })
        })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var getmy='select *from user where platform=? and account=?'
           
        
            var getchatrequests='select roomid,organizer,participant,joined,user.nickname,user.gender,if(isnull(user.profileimage),?,user.profileimage) as profileimage from (select roomid,organizer,participant,joined from chatroom where participant=? and joined=?) chatroom '+
            'inner join (select userid,nickname,gender,profileimage from user) user on organizer=user.userid'
            connection.query(getmy,[platform,account],function(err,myresult){
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    connection.query(getchatrequests,['none',myresult[0].userid,0],function(err,result){
                        if(err)
                        {
                           
                            console.log(err)
                        }
                        else
                        {
                            if(result.length==0)
                            {
                    
                                res.json({
                                    resultCode:400,
                                    requests:[]
                                })
                            }
                            else
                            {
            
                                res.json({
                                    resultCode:200,
                                    requests:result
                                })
                            }
                        }
                    })
                }
            })
        }
   })
  


})
app.post('/requestchat',verifyToken,(req,res)=>{

    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            console.log('인증실패')
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                value:505
            })
        })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var userid=req.body.userid

    
            var roomid=req.body.roomid
        
            var getmy='select *from user where platform=? and account=?'
        
            var getuser='select *from user where userid=?'
            var checkblock='select *from block where (userid=? and blockeduserid=?) or (userid=? and blockeduserid=?)'
        
        
            var searchroom='select *from chatroom where organizer=? and participant=? and joined=0'
            var insertchatroom='insert into chatroom(roomid,organizer,participant,joined) values(?,?,?,?)'
            var searchuserrooms='select roomid,organizer,participant,joined,user.nickname,user.gender,if(isnull(user.profileimage),?,user.profileimage) as profileimage from (select roomid,organizer,participant,joined from chatroom where participant=? and joined=0) chatroom '+
            'inner join (select userid,nickname,gender,profileimage from user) user on organizer=user.userid'
        
            connection.query(getmy,[platform,account],function(err,myresult){
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    connection.query(checkblock,[userid,myresult[0].userid,userid,myresult[0].userid],function(err,result){
                        if(err)
                        {
                            console.log(err)
                        }
                        else{
                            if(result.length!=0)
                            {
                                res.json({
                                    resultCode:500,
                                    value:500
                                })
                            }
                            else
                            {
                                connection.query(searchroom,[myresult[0].userid,userid],function(err,result){
                                    if(err)
                                    {
                                        console.log(err)
                                    }
                                    else
                                    {
                                        if(result.length==0)
                                        {
                    
                                            connection.query(getuser,userid,function(err,userresult){
                                                if(err)
                                                {
                                                    console.log(err)
                                                }
                                                else
                                                {
            
                                                    if(userresult[0].chatreceive==1)
                                                    {
                                                        connection.query(insertchatroom,[roomid,myresult[0].userid,userid,0],function(err,result){
                                                            if(err)
                                                            {
                                                                console.log(err)
                                                            }
                                                            else
                                                            {
                                                                connection.query(searchuserrooms,['none',userid],function(err,roomresult){
                                                                    if(err)
                                                                    {
                                                                        console.log(err)
                                                                    }
                                                                    else{
                                                                      
                                                                        console.log(roomresult)
                                                                        io.to(userresult[0].socketid).emit('updatechatrequest',JSON.stringify(roomresult))
            
                                                                        console.log(userresult[0].fcmtoken)
                                                                        var payload={
                                                                            data:{
                                                                                title:'고민나눔',
                                                                                message:myresult[0].nickname+'님이 대화를 요청했습니다',
                                                                                notitype:'comment',
                                                                                click_action:'NOTIFICATION_CLICK'
                                                                            },
                                                                            token:userresult[0].fcmtoken
                                                                        }
                                                                        if(userresult[0].fcmtoken!="")
                                                                        {
                                                                            admin.messaging().send(payload)
                                                                            .then(function(response){
                                                                                console.log("Succesfully send message",response)
                                                                            })
                                                                            .catch(function(error){
                                                                                console.log("Error sending message",error)
                                                                            })
                                                                        }
                                                                        res.json({
                                                                            resultCode:200,
                                                                            value:200
                                                                        })
                                                                    }
                                                                })
            
                        
                                                            }
                                                        })
                                                    }
                                                    else
                                                    {
                                                        res.json({
                                                            resultCode:300,
                                                            value:300
                                                        })
                                                    }
                                                    
                                                    
                    
                    
                                            
                                                }
                                            })
                                        
                                        }
                                        else
                                        {
                                            res.json({
                                                resultCode:400,
                                                value:400
                                            })
              
                                        }
                                    }
                                })
                            }
                        }
                    })
                   
                }
            })
        
        }
   })
   
    



    



    
})
app.post('/refusechat',(req,res)=>{
    var roomid=req.body.roomid
    var userid=req.body.userid
    var deletechat='delete from chatroom where roomid=?'
    var getchatrequests='select roomid,organizer,participant,joined,user.nickname,user.gender,if(isnull(user.profileimage),?,user.profileimage) as profileimage from (select roomid,organizer,participant,joined from chatroom where participant=? and joined=?) chatroom '+
    'inner join (select userid,nickname,gender,profileimage from user) user on organizer=user.userid'

    connection.query(deletechat,roomid,function(err,result){
        if(err)
        {
            console.log(err)
        }
        else{
            connection.query(getchatrequests,['none',userid,0],function(err,result){
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    if(result.length==0)
                    {
                        res.json({
                            resulCode:400,
                            requests:[]
                        })
                    }
                    else
                    {
                        res.json({
                            resulCode:200,
                            requests:result
                        })
                    }
                 
                }
            })

        }
    })


})
app.post('/getChatprofiles',verifyToken,(req,res)=>{
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
            deleteToken(req.token,function(){
            res.json({
                resultCode:505,
                profiles:[]
            })
        })
        }
        else{
            var platform=authData.user.platform
            var account=authData.user.account
            var getmy='select *from user where platform=? and account=?'
            connection.query(getmy,[platform,account],function(err,myresult){
                if(err)
                {

                }
                else{
                    var myid=myresult[0].userid

                    var getprofiles='select * from(select roomid,if(isnull(user.userid),?,user.userid) as userid,if(isnull(user.profileimage),?,user.profileimage) as profileimage,if(isnull(user.gender),?,user.gender) as gender,if(isnull(user.nickname),?,user.nickname) as nickname from((select roomid,organizer as userid from chatroom'+
                    ' where participant=? and joined=1) union (select roomid,participant as userid from chatroom where organizer=?)) roomuser left outer join (select userid,'+
                    'nickname,profileimage,gender from user)user on roomuser.userid=user.userid)rooms where userid not in (select userid from block where blockeduserid=?) and userid not in (select blockeduserid from block where userid=?)'

                
                    connection.query(getprofiles,[0,'none','비공개','대화상대없음',myid,myid,myid,myid],function(err,result){
                        if(err)
                        {
                            console.log(err)
                        }
                        else{
                            if(result.length==0){
                                res.json({
                                    resultCode:300,
                                    profiles:[]
                                })
                            }
                            else{
                                res.json({
                                    resultCode:200,
                                    profiles:result
                                })
                            }
                            

                        }
                    })

                }
            })
        }
    })

})
app.post('/acceptchat',(req,res)=>{
    var roomid=req.body.roomid
    var organizer=req.body.organizer
    var participant=req.body.participant
    var time=timestamp()


    var join='update chatroom set joined=1 where roomid=?'
    var getuser='select *from user where userid=?'
    var getchatrequests='select roomid,organizer,participant,joined,user.nickname,user.gender,if(isnull(user.profileimage),?,user.profileimage) as profileimage from (select roomid,organizer,participant,joined from chatroom where participant=? and joined=?) chatroom '+
    'inner join (select userid,nickname,gender,profileimage from user) user on organizer=user.userid'
  
   
    connection.query(join,roomid,function(err,result){
        if(err)
        {
            console.log(err)
        }
        else
        {
            
              
                    connection.query(getuser,organizer,function(err,userresult){
                        if(err)
                        {
                            console.log(err)
                        }
                        else
                        {
                            connection.query(getuser,participant,function(err,myresult){
                                if(err)
                                {
                                    console.log(err)

                                }
                                else{
                                  
                                    var sendcontent={
                                        dateChanged:0,
                                        profileimage:myresult[0].profileimage,
                                        nickname:myresult[0].nickname,
                                        gender:myresult[0].gender,
                                        senderid:participant,
                                        roomid:roomid,
                                        date:time,
                                        type:'start',
                                        content:'대화가 시작되었습니다'
                                    }
                                    io.to(userresult[0].socketid).emit('updaterooms',JSON.stringify(sendcontent))                                                                                      
                                                    var payload={
                                                        data:{
                                                            dateChanged:'0',
                                                            senderid:String(participant),
                                                            roomid:roomid,
                                                            date:time,
                                                            type:'start',
                                                            content:'대화가 시작되었습니다',
                                                            title:'고민나눔',
                                                            message:myresult[0].nickname+'님이 채팅요청을 수락했습니다',
                                                            notitype:'chat',
                                                            click_action:'NOTIFICATION_CLICK'
                                                        },
                                                        token:userresult[0].fcmtoken
                                                    
                                                    }
                                                    if(userresult[0].fcmtoken!="")
                                                    {
                                                        admin.messaging().send(payload)
                                                        .then(function(response){
                                                            console.log("Succesfully send message",response)
                                                        })
                                                        .catch(function(error){
                                                            console.log("Error sending message",error)
                                                        })
                                                    }
                                                   
    
                                                connection.query(getchatrequests,['none',participant,0],function(err,result){
                                                    if(err)
                                                    {
                                                        console.log(err)
                                                    }
                                                    else
                                                    {
                                                        if(result.length===0)
                                                        {
                                                    
                                                            res.json({
                                                                resultCode:400,
                                                                requests:[]
                                                            })
                                                        }
                                                        else
                                                        {

                                                            res.json({
                                                                resultCode:200,
                                                                requests:result
                                                            })
                                                        }
                                                        

                                                    }
                                                })
                                            
                                        
                                    
                                }
                            })
                           
                        }
                    })
                  
                
           
        }
    })
})
app.post('/deleteAllNoti',verifyToken,(req,res)=>{


    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
        console.log('인증오류발생')
        deleteToken(req.token,function(){
        res.json({
            resultCode:505,
            value:505
        })
    })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var param=[platform,account]
            var deleteall='delete from noti where platform=? and account=?'
        
            connection.query(deleteall,param,function(err,result){
                if(err)
                {
                    console.log(err)
                    res.json({
                        resultCode:400,
                        value:400
                    })
                }
                else
                {
                  
                    res.json({
                        resultCode:200,
                        value:200
                    })
                }
            })
        }
   })
 
})

app.post('/readNoti',(req,res)=>{
    var notiid=req.body.notiid
    var updateread='update noti set isread=1 where notiid=?'

    connection.query(updateread,notiid,function(err,result){
        if(err)
        {
            console.log(err)
            res.json({
                resultCode:100,
                value:100
            })
        }
        else
        {
            res.json({
                resultCode:200,
                value:200
            })
        }
    })
})
app.post('/getSelectedPost',verifyToken,(req,res)=>{
    var postid=req.body.postid
    var latitude=req.body.latitude
    var longitude=req.body.longitude

    var param=[]
    var query=""
    var getpostuser='select *from post where postid=?'
    var getmy='select *from user where platform=? and account=?'
    var blockquery='select *from block where (userid=? and blockeduserid=?) or (userid=? and blockeduserid=?)'
    connection.query(getpostuser,postid,function(err,postuser){
        if(err)
        {
            console.log(err)
        }
        else
        {
            if(postuser.length==0)
            {
                return res.json({
                    resultCode:100,
                    posts:[]
                })
            }
            else
            {
                jwt.verify(req.token,'secretkey',(err,authData)=>{
                    if(err)
                    {
                        deleteToken(req.token,function(){
                        res.json({
                            resultCode:505,
                            posts:[]
                        })
                    })
                    }
                    else
                    {
                        var platform=authData.user.platform
                        var account=authData.user.account
                        connection.query(getmy,[platform,account],function(err,myresult){
                            if(err)
                            {
                                console.log(err)
                            }
                            else
                            {
                                connection.query(blockquery,[postuser[0].userid,myresult[0].userid,myresult[0].userid,postuser[0].userid],function(err,blockresult){
                                    if(err)
                                    {
                                        console.log(err)
                                    }
                                    else
                                    {
                                        if(blockresult.length!=0)
                                        {
                                            return res.json({
                                                resultCode:400,
                                                posts:[]
                                            })
                                        }
                                        else{
                                            if(latitude==undefined)
                                            {
                                                
                                                    param=[platform,account,platform,account,postid]
                                                    query="select post.postnum,post.vote,post.postid,post.userid,post.account,post.platform,getuser.nickname,getuser.profileimage,post.anonymous,post.gender,post.text,tag.tags,post.date,post.image,"
                                                    +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(likcount.likecount,0) as likecount,if(isnull(bmark.account),0,1) as bookmarked,if(isnull(likpost.platform),0,1) as isLiked from post left outer"
                                                    +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                                                    " join (select postid,count(*) as likecount from likepost group by postid) likcount on post.postid=likcount.postid"+
                                                    " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                                                " left outer join(select postid,account from bookmark where platform=? and account=?) bmark on post.postid=bmark.postid"+
                                                " left outer join(select postid,platform from likepost where platform=? and account=?) likpost on post.postid=likpost.postid"+
                                                " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id"+
                                                    " having post.postid=?"
                                              
                                                  
                                                
                                               
                                            }
                                            else
                                            {
                                               
                                                    param=[latitude,longitude,latitude,platform,account,platform,account,postid]
                                            
                                                 
                                                    query="select post.postnum,post.vote,post.postid,post.userid,post.account,post.platform,getuser.nickname,getuser.profileimage,post.anonymous,post.gender,post.text,tag.tags,post.date,post.image,"
                                                    +"post.audio,ifnull(com.commentcount,0) as commentcount,ifnull(likcount.likecount,0) as likecount,if(isnull(bmark.account),0,1) as bookmarked,if(isnull(likpost.platform),0,1) as isLiked,if(isnull(post.latitude),-100.0,(6371*acos(cos(radians(?))*cos(radians(post.latitude))*cos"+
                                                    "(radians(post.longitude)-radians(?))+sin(radians(?))*sin(radians(post.latitude))))) as distance from post left outer"
                                                    +" join (select postid,count(*) as commentcount from comment group by postid) com on post.postid=com.postid left outer"+
                                                    " join (select postid,count(*) as likecount from likepost group by postid) likcount on post.postid=likcount.postid"+
                                                    " left outer join (select postid,group_concat(tagname separator '#') as tags from posttag group by postid) tag on post.postid=tag.postid"+
                                        " left outer join(select postid,platform,account from bookmark where platform=? and account=?) bmark on post.postid=bmark.postid"+
                                        " left outer join(select postid,platform from likepost where platform=? and account=?) likpost on post.postid=likpost.postid"+
                                        " left outer join (select userid as id,nickname,profileimage from user) getuser on post.userid=getuser.id"+
                                                    " having post.postid=?"
                                                
                                               
                                                  
                                        
                                                }
                                                connection.query(query,param,function(err,result){
                                                    if(err)
                                                    {
                                                        console.log(err)
                                                    }
                                                    else
                                                    {
                                                        if(result && result.length)
                                                        {
                                                            res.json({
                                                                resultCode:200,
                                                                posts:result
                                                            
                                                            })
                                                        }
                                                        else{
                                                        
                                                            res.json({
                                                                resultCode:100,
                                                                posts:[]
                                                            })
                                            
                                                        } 
                                                    }
                                                })
                                        
                                        }
                                    }
                                })
                            }
                        })
                    }
                })
                
            }
        }
    })
    
})
app.post("/getAnonymous",verifyToken,(req,res,next)=>{
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
        console.log('인증오류발생')
        deleteToken(req.token,function(){
        res.json({
            resultCode:505,
            message:""
        })
    })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var postid=req.body.postid
 
    var param=[postid,platform,account]

    var query='select *from comment where postid=? and platform=? and account=? and anonymous is not null'
    connection.query(query,param,function(err,result){
        if(err)
        {
            console.log(err)
        }
        else
        {
            if(result.length==0)
            {
        
                res.json({
                    resultCode:100,
                    message:""
                })
            }
            else
            {
                res.json({
                    resultCode:200,
                    message:result[0].anonymous
                })
            }
        }
    })

        }
   })
    
})
app.post('/withdrawal',verifyToken,(req,res)=>{
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
        console.log('인증오류발생')
        deleteToken(req.token,function(){
        res.json({
            resultCode:505,
            value:505
        })
    })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            var getmy='select *from user where platform=? and account=?'
            var deletebookmarks='delete from bookmark where postid in (select post.postid from (select * from post where userid=?) as post)'
            var deletepostcomments='delete from comment where postid in (select post.postid from (select * from post where userid=?) as post)'
            var deleteposts='delete from post where userid=?'
            var deletecommentgroups='delete from comment where ref in(select com.ref from (select *from comment where userid=? and depth=0) as com)'
            var deletecomments='delete from comment where userid=?'
            
            var withdrawal='update user set platform=?,gender=?,nickname=?,password=NULL,account=NULL,authtoken="",fcmtoken="",socketid="",profileimage=? where userid=?'
            connection.query(getmy,[platform,account],function(err,userresult){
                if(err)
                {
                    console.log(err)
                }
                else
                {

                    connection.query(deletebookmarks,userresult[0].userid,function(err,result){
                        if(err)
                        {
                            console.log(err)
                        }
                    })
                    connection.query(deletepostcomments,userresult[0].userid,function(err,result){
                        if(err)
                        {
                            console.log(err)
                        }
                    })
                    connection.query(deleteposts,userresult[0].userid,function(err,result){
                        if(err)
                        {
                            console.log(err)
                        }
                    })
                    connection.query(deletecommentgroups,userresult[0].userid,function(err,result){
                        if(err)
                        {
                            console.log(err)
                        }
                    })
                    connection.query(deletecomments,userresult[0].userid,function(err,result){
                        if(err)
                        {
                            console.log(err)
                        }
                    })
                    connection.query(withdrawal,['OUT','비공개','(알수없음)','none',userresult[0].userid],function(err,result){
                        if(err)
                        {
                            console.log(err)
                        }
                        else
                        {
                            res.json({
                                resultCode:200,
                                value:200
                            })
                        }
                    })

                }
            })
        }
    })

})
app.post("/checkuser",verifyToken,(req,res)=>{
    var userid=req.body.userid
    var getmy='select *from user where platform=? and account=?'
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err)
        {
        console.log('인증오류발생')
        deleteToken(req.token,function(){
        res.json({
            resultCode:505,
            value:userid
        })
    })
        }
        else
        {
            var platform=authData.user.platform
            var account=authData.user.account
            connection.query(getmy,[platform,account],function(err,myresult){
                if(err)
                {

                }
                else{
                    var checkblock='select *from block where (userid=? and blockeduserid=?) or (userid=? and blockeduserid=?)'
                    var checkfollowing='select *from follow where userid=? and follower=?'
                    var checkwithdrawal='select *from user where userid=?'

                    connection.query(checkblock,[userid,myresult[0].userid,myresult[0].userid,userid],function(err,result){
                        if(err)
                        {

                        }
                        else{
                            if(result.length!=0)
                            {
                                res.json({
                                    resultCode:500,
                                    value:userid
                                })
                            }
                            else{
                                connection.query(checkfollowing,[userid,myresult[0].userid],function(err,followingresult){
                                    if(err){
                                    }
                                    else{
                                        connection.query(checkwithdrawal,userid,function(err,result){
                                            if(err)
                                            {
        
                                            }
                                            else{
                                                var following=0
                                                if(followingresult.length!=0){
                                                    following=1
                                                }
                                                if(result[0].platform=='OUT')
                                                {
                                                    res.json({
                                                        resultCode:400,
                                                        userid:userid,
                                                        following:following
                                                    })
                                                }
                                                else{
                                                    res.json({
                                                        resultCode:200,
                                                        userid:userid,
                                                        following:following
                                                    })
                                                }
                                            }
                                        })
                                    }
                                })
                              
                            }
                        }
                    })
                    
                }
            })
        }
    })
})
app.post("/getuserprofile",(req,res)=>{
    var userid=req.body.userid
    var query="select *from(select user.userid,user.account,age,nickname,gender,profileimage,if(isnull(follower.followercount),0,follower.followercount) as followercount,if(isnull(following.followingcount),0,following.followingcount) as followingcount,"+
    " if(isnull(userpost.postscount),0,userpost.postscount) as postscount from"+
    " user"+
    " left outer join (select userid,count(*) as followercount from follow group by userid) follower on user.userid=follower.userid"+
    " left outer join (select userid,count(*) as postscount from post group by userid) userpost on user.userid=userpost.userid"+
    " left outer join(select follower,count(*) as followingcount from follow group by follower) following on user.userid=following.follower"+
    ")selecteduser where userid=?"
    
    connection.query(query,userid,function(err,result){
        if(err)
        {
            console.log(err)
        }
        else
        { 
            if(result.length==0)
            {
                res.json({
                    resultCode:400,
                    profileimage:'',
                    nickname:'',
                    gender:'',
                    followercount:0,
                    followingcount:0,
                    postscount:0,
                    age:0
                })
            }
            else{
                res.json({
                    resultCode:200,
                    account:result[0].account,
                    profileimage:result[0].profileimage,
                    nickname:result[0].nickname,
                    gender:result[0].gender,
                    followercount:result[0].followercount,
                    followingcount:result[0].followingcount,
                    postscount:result[0].postscount,
                    age:result[0].age
                })
            }  
          

        }
    })
})
app.post("/search",(req,res,next)=>{

    var post_data=req.body
    var name_search=post_data.search
    console.log(name_search)

    var query="SELECT * FROM user WHERE name LIKE '%"+name_search+"%'";

    connection.query(query,function(error,result,field){
        connection.on('error',function(err){
            console.log('[MYSQL]ERROR',err)
        })
        if(result && result.length)
        {
           
      
            res.end(JSON.stringify(result))
       
        }
        else{
            res.end(JSON.stringify([]))
        }
    })



})
app.post("/getChatRooms",verifyToken,(req,res)=>{

    var query='select *from user where authtoken=?'
    var getchat='SELECT *FROM chatlist WHERE email=? and lastword is not null ORDER BY date DESC'

    connection.query(query,req.token,function(err,result){
        if(err)
        {
            console.log(err)
        }
        else{
            connection.query(getchat,result[0].email,function(err,data){
                if(err)
                {
                    console.log(err)
                }
                else{
                    if(data && data.length)
                    {
                        res.end(JSON.stringify(data))
                    }
                    else{
                        res.end(JSON.stringify([]))
                    }
                }

            })
            
        }
    })
})

app.post("/getChat",verifyToken,(req,res)=>{
    var roomid=req.body.roomid
    var mail=req.body.email
    console.log(mail)
    var query='select *from chatcontent where roomuid=?'
    var updateread1='update chatlist set isread=? where roomuid=? and email=? '
    var updateread2='update chatcontent set isread=? where roomuid=? and sender!=?'
    var param=[1,roomid,mail]
    
    
    
    connection.query(query,roomid,(err,result)=>{
        if(result && result.length)
        {
           
      
            connection.query(updateread1,param,function(err,result){
                if(err)
                {
                    console.log(err)
                }
                else{
            
                }
            })
            connection.query(updateread2,param,function(err,result){
                if(err)
                {
                    console.log(err)
                }
                else{
                }
            })
            res.end(JSON.stringify(result))
       
        }
        else{
            res.end(JSON.stringify([]))
        }

    })
})
app.post('/authsms',(req,res)=>{
    send_message(req.body.phone)
    res.json({
        resultCode:200
    })
})
app.post('/verifycode',(req,res)=>{

    if(req.body.code==cache.get(req.body.phone))
    {
        cache.del(req.body.phone)
        res.json({
            resultCode:200
        })
    }
    else
    {
        res.json({
            resultCode:404
        })
    }

})

//FORMAT OF TOKEN
//Authorization:Bearer<access_token>
//Verify Token
function verifyToken(req,res,next){
    //Get auth header value
    const bearerHeader=req.headers['authorization'];
    //Check if bearer is undefined
    if(typeof bearerHeader!=='undefined'){
        //split at the space
        const bearer=bearerHeader.split(' ');
        //Get token from array
        const bearerToken=bearer[1];
        //Set the token
        req.token=bearerToken;
        //Nextmiddleware
        next();
    }else{
        //Forbidden
        res.sendStatus(403);
    }


}
function deleteToken(token,callback){
    var deletetoken='update user set authtoken="",fcmtoken="" where authtoken=?'
    connection.query(deletetoken,token,function(err,result){
        if(err)
        {
            console.log(err)
        }
        else
        {
            callback()
        }
    })
}
function timestamp(){
    var today = new Date();
    today.setHours(today.getHours() + 9);
    return today.toISOString().replace('T', ' ').substring(0, 19);
}
function send_message(phone) {
    let number = Math.floor(Math.random() * 1000000)+100000; // ★★난수 발생 ★★★★★
    if(number>1000000){                                      // ★★
       number = number - 100000;                             // ★★
    }
    var num=String(number)
    cache.del(phone)
    cache.put(phone,num)
    const user_phone_number = phone;

    const date = Date.now().toString();
    
    // 환경변수로 저장했던 중요한 정보들
    const serviceId = 'ncp:sms:kr:274802285988:androidsms';// 
    const secretKey = 'sBaY1pB3KmXNjSottf4ZVic1bqKTPRU5J5YJ5hb0';//
    const accessKey = 'G9nAoHAN5xQgnpPgtq9a';//
    const my_number = '01057135288';
     // 그 외 url 관련
     const method = "POST";
     const space = " ";
     const newLine = "\n";
     const url = `https://sens.apigw.ntruss.com/sms/v2/services/${serviceId}/messages`;
     const url2 = `/sms/v2/services/${serviceId}/messages`;
     const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);
     hmac.update(method);
     hmac.update(space);
     hmac.update(url2);
     hmac.update(newLine);
     hmac.update(date);
     hmac.update(newLine);
     hmac.update(accessKey);
     const hash = hmac.finalize();
     const signature = hash.toString(CryptoJS.enc.Base64);
     axios({
        method: method,
        // request는 uri였지만 axios는 url이다
        url: url,
        headers: {
            "Contenc-type": "application/json; charset=utf-8",
            "x-ncp-iam-access-key": accessKey,
            "x-ncp-apigw-timestamp": date,
            "x-ncp-apigw-signature-v2": signature,
        },
        // request는 body였지만 axios는 data다
        data: {
            type: "SMS",
            countryCode: "82",
            from: my_number,
            // 원하는 메세지 내용
            content: `[고민앱] 인증번호 [${num}]를 입력해주세요.`,
            messages: [
            // 신청자의 전화번호
                { to: `${user_phone_number}`, },],
        },
    }).then(res => {
        console.log(res.data);
    })
        .catch(err => {
            console.log(err);
        })
    return '';
  }
app.get('/hello',function(req,res){
    res.json({
        resultCode:300
    })
})
var port = process.env.PORT || 3000;//1
server.listen(port, () => {
    console.log(`Server listening at http://localhost:80`)
  })
