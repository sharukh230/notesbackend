const express = require("express")
const jwt = require("jsonwebtoken")
require('dotenv').config()
const bcrypt = require('bcrypt');
const cors = require("cors")


const {connection} = require("./config/db")
const {UserModel} = require("./models/User.model")
const {notesRouter} =require("./routes/notes.route");
const { authenticate } = require("./middlewares/authentication");
const app = express()


app.use(express.json())  //Middleware
app.use(cors({
    origin:"*"
}))


app.get("/",(req,res)=>{
    res.send("Home")
})


app.post("/signup",async(req,res)=>{
    const {email,password,name,age}=req.body;
    //to check if the user is present with same emailId
    const userPresent = await UserModel.findOne({email})
    if(userPresent?.email){
        res.send("try logging in, already exist")
    }
    try{
        bcrypt.hash(password, 5, async function(err, hash) {
            // Store hash in your password DB.
            const user = new UserModel({email,password:hash,name,age})
            await user.save()
            res.send({"msg":"Sign up successfull"})
        });
        
    }catch(err){
        console.log(err)
        res.send("Something went wrong, plz try again later")
    }
})


app.post("/login",async(req,res)=>{
    const{ email , password} = req.body;
    try{
        const user = await UserModel.find({email})
        if(user.length>0){
            const hashed_password=user[0].password
            bcrypt.compare(password,hashed_password, function(err,result){
                if(result){
                    const token = jwt.sign({ "userID":user[0]._id }, 'hussh');
                    res.send({"msg":"Login Successful","token":token})
                }else{
                    res.send({"msg":"Login failed"})
                }   
            })
        }
        else{
            res.send("Login failed")
        }
    }
    catch(err){
        console.log(err);
        console.log("Something went wrong, plz try again later")
    }
})


app.get("/purchased",(req,res)=>{
    // const token=req.query.token

    //Bearer <== convention
    const token = req.headers.authorization?.split(" ")[1]
    const decoded = jwt.verify(token,'hussh',(err,decoded)=>{
        if(err){
            res.send("Please login again")
        }
        else if(decoded){
            res.send("purchased data ...")
        }
    })
  
})

app.use(authenticate)
app.use("/notes",notesRouter)


app.listen(process.env.port,async()=>{
    try{
        await connection;
        console.log("Connected to DB successfully")
    }
    catch(err){
        console.log("Error connecting DB")
        console.log(err)
    }
    console.log(`Listening on PORT ${process.env.port}`)
})