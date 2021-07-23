var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
const co = require('co');
const User = require('../User');
const { response } = require('express');

// TODO: Remove hardcoded link
// var url = 'mongodb://localhost:27014/';
// var url = 'mongodb://localhost:27017/';

var url="mongodb+srv://user1:mcZZSFTM_2Q_32T@cluster0.r08ei.mongodb.net/admin?retryWrites=true&w=majority";

var datab = 'Split_Consensus_DB'
var userID = null
let users = [];


//get user instance function
let getUserInstance = uid => users.find(user => user.id === uid);

//snooze function 
const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));


//
//Get home page
//


router.get('/', function (req, res, next) {
    res.render('index');
});

//////////////////////////////////////////////////////////////DONE
router.post('/activity1/', function(req,res,next){

    //prompt to enter username if null
    if (!req.body.userID) {
        res.render('index', {error: "ERROR: Please enter a username"});
        return;
    }

    //Fetch current user if it exists
    let currentUser = getUserInstance(req.body.userID);
  
    //add new user if not already exists based on id
    if (!currentUser) {
        users.push(new User(req.body.userID));
        //now that we've added a new instance, obtain user
        currentUser = getUserInstance(req.body.userID);
    }


    // questionNum = currentUser.selectQuestion()


    //store user in db
    co(function* () {

        let client = yield MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db(datab)
        let usersCol = db.collection('users')

        check = yield usersCol.findOne({"user": currentUser.id})

        //check to see if user exists in database
        if (check === null && currentUser.id != null) {

            //insert new user if user does not exist
            var item = {
                "user": currentUser.id,
                "key2pay": null,
                "surveyResults": null,
            };

            yield usersCol.insertOne(item);

            res.render('activity1', {
                time: 60,
                userID: currentUser.id,
                question: 1,
                sequence: currentUser.question
            })

        } else {
            res.render('index', {error: "ERROR: Username already exists"});
        }

    });
});


//
//load activity
//

///////////////////// ACTIVITY 1 ///////////////////////////

//////////////////////////////////////////////////////////////DONE
router.post('/activity9/:userID/', function (req, res, next) {

    //Fetch current user
    userID = req.params.userID;
    let currentUser = getUserInstance(userID);
    // console.log(currentUser);

    // console.log(req.body)
    // group = JSON.parse(group)
    // console.log(group)

    // prevTime = currentUser.getPrevTime()

    currentUser.setPrevTime(req.body.time)
        time = 60 - req.body.time;


    co(function* () {

        let client = yield MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db(datab)
        let responseCol = db.collection('responses');

        if(req.body.sec=="1:60"){
            time_taken="1:30";
        }else{
            time_taken=req.body.sec;
        }


        var item = {
            "user": userID,
            "question": 8,
            "time_taken":time_taken,
            "extra_time_taken":req.body.extra,
            '35k': req.body.thirtyFiveThousand.split(','),
            '30-35k': req.body.thirtyThousand.split(','),
            '25-30k': req.body.twentyFiveThousand.split(','),
            '20-25k': req.body.twentyThousand.split(','),
            '15-20k': req.body.fifteenThousand.split(','),
            '10-15k': req.body.tenThousand.split(','),
            '7_5-10k': req.body.sevenThousandFiveHundred.split(','),
            '5-7_5k': req.body.fiveThousand.split(','),
            '3-5k': req.body.threeThousand.split(','),
            '1-3k': req.body.oneThousand.split(','),
        };

        console.log(item)

        yield responseCol.insertOne(item);
        console.log('posted to db!')

    });

    // prevTime = currentUser.getPrevTime()

    //check to ensure previous response was posted
    co(function* () {

        yield snooze(1000)

        let client = yield MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        check = yield responseCol.findOne({"user": currentUser.id, "question": 8})

        if (check == null) {

            res.render('activity8', {
                time: 90,
                userID: currentUser.id,
                question: 8,
                sequence: currentUser.question,
                error: "ERROR: Please answer all questions!"
            })

        } else {

            // currentUser.nextquestion()

            // questionNum = currentUser.selectQuestion()

            // console.log(questionNum)
            // console.log("Question number selected: "+questionNum)

            if (currentUser.question < 15) {
                
                res.render('activity9', {
                    time: 90,
                    userID: currentUser.id,
                    question: 9,
                    sequence: currentUser.question
                })
            } else {
                res.render('survey', {userID: currentUser.id})
            }

        }
    });

});

//////////////////////////////////////////////////////////////DONE
router.post('/activity5/:userID/', function (req, res, next) {


    userID = req.params.userID;
    let currentUser = getUserInstance(userID);

    console.log(req.body.order)
    order = req.body.order
    var nameArr = order.split(',');
    console.log(nameArr);

    co(function* () {

        let client = yield MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        if(req.body.sec=="1:60"){
            time_taken="0:60";
        }else{
            time_taken=req.body.sec;
        }

        if(nameArr.length==1){
            console.log("Initialising default");
            nameArr=["doctor","makeup_artist","software_developer","dentist","priest","teacher"];
        }

        var item = {
            "user": userID,
            "question": 4,
            "time_taken":time_taken,
            "extra_time_taken":req.body.extra,
            'sequence': nameArr
        };

        console.log(item);

        yield responseCol.insertOne(item);
        console.log('posted to db!')

    });

    co(function* () {

        yield snooze(1000)

        let client = yield MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        check = yield responseCol.findOne({"user": currentUser.id, "question": 4})

        if (check == null) {

            res.render('activity4', {
                time: 60,
                userID: currentUser.id,
                question: 4,
                sequence: currentUser.question,
                error: "ERROR: Please answer all questions!"
            })

        } else {

            if (currentUser.question < 15) {
                
                res.render('activity5', {
                    time: 60,
                    userID: currentUser.id,
                    question: 5,
                    sequence: currentUser.question
                })
            } else {
                res.render('survey', {userID: currentUser.id})
            }

        }
    });

});
//////////////////////////////////////////////////////////////DONE
router.post('/activity2/:userID/', function (req, res, next) {


    userID = req.params.userID;
    let currentUser = getUserInstance(userID);

    console.log(req.body.order)
    order = req.body.order
    var nameArr = order.split(',');
    console.log(nameArr);

    co(function* () {

        let client = yield MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        if(req.body.sec=="1:60"){
            time_taken="0:60";
        }else{
            time_taken=req.body.sec;
        }

        if(nameArr.length==1){
            console.log("Initialising default");
            nameArr=["girl1","girl2","girl3","girl4","girl5","girl6","girl7","girl8"];
        }

        var item = {
            "user": userID,
            "question": 1,
            "time_taken":time_taken,
            "extra_time_taken":req.body.extra,
            'sequence': nameArr
        };

        console.log(item);

        yield responseCol.insertOne(item);
        console.log('posted to db!')

    });

    co(function* () {

        yield snooze(1000)

        let client = yield MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        check = yield responseCol.findOne({"user": currentUser.id, "question": 1})

        if (check == null) {

            res.render('activity1', {
                time: 60,
                userID: currentUser.id,
                question: 1,
                sequence: currentUser.question,
                error: "ERROR: Please answer all questions!"
            })

        } else {

            if (currentUser.question < 15) {
                
                res.render('activity2', {
                    time: 60,
                    userID: currentUser.id,
                    question: 2,
                    sequence: currentUser.question
                })
            } else {
                res.render('survey', {userID: currentUser.id})
            }

        }
    });

});

//////////////////////////////////////////////////////////////DONE
router.post('/activity13/:userID/', function (req, res, next) {


    userID = req.params.userID;
    let currentUser = getUserInstance(userID);

    console.log(req.body.order)
    order = req.body.order
    var nameArr = order.split(',');
    console.log(nameArr);

    co(function* () {

        let client = yield MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        if(req.body.sec=="1:60"){
            time_taken="0:60";
        }else{
            time_taken=req.body.sec;
        }

        if(nameArr.length==1){
            console.log("Initialising default");
            nameArr=["garbage","oilspill","industry","energy_production","transportation","cattle"];
        }

        var item = {
            "user": userID,
            "question": 12,
            "time_taken":time_taken,
            "extra_time_taken":req.body.extra,
            'sequence': nameArr
        };

        console.log(item);

        yield responseCol.insertOne(item);
        console.log('posted to db!')

    });

    co(function* () {

        yield snooze(1000)

        let client = yield MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        check = yield responseCol.findOne({"user": currentUser.id, "question": 12})

        if (check == null) {

            res.render('activity12', {
                time: 60,
                userID: currentUser.id,
                question: 12,
                sequence: currentUser.question,
                error: "ERROR: Please answer all questions!"
            })

        } else {

            if (currentUser.question < 15) {
                
                res.render('activity13', {
                    time: 60,
                    userID: currentUser.id,
                    question: 13,
                    sequence: currentUser.question
                })
            } else {
                res.render('survey', {userID: currentUser.id})
            }

        }
    });

});

//////////////////////////////////////////////////////////////DONE
router.post('/activity12/:userID/', function (req, res, next) {


    userID = req.params.userID;
    let currentUser = getUserInstance(userID);

    console.log(req.body.order)
    order = req.body.order
    var nameArr = order.split(',');
    console.log(nameArr);


    co(function* () {

        let client = yield MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        if(req.body.sec=="1:60"){
            time_taken="0:60";
        }else{
            time_taken=req.body.sec;
        }

        if(nameArr.length==1){
            console.log("Initialising default");
            nameArr=["recycling","noCar_culture","local_consumption","civilian_demands","industry_regulations","alternative_energies","picking_up_garbage","reforestation"];
        }

        var item = {
            "user": userID,
            "question": 11,
            "time_taken":time_taken,
            "extra_time_taken":req.body.extra,
            'sequence': nameArr
        };

        console.log(item);

        yield responseCol.insertOne(item);
        console.log('posted to db!')

    });

    co(function* () {

        yield snooze(1000)

        let client = yield MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        check = yield responseCol.findOne({"user": currentUser.id, "question": 11})

        if (check == null) {

            res.render('activity11', {
                time: 60,
                userID: currentUser.id,
                question: 11,
                sequence: currentUser.question,
                error: "ERROR: Please answer all questions!"
            })

        } else {

            if (currentUser.question < 15) {
                
                res.render('activity12', {
                    time: 60,
                    userID: currentUser.id,
                    question: 12,
                    sequence: currentUser.question
                })
            } else {
                res.render('survey', {userID: currentUser.id})
            }

        }
    });

});

//////////////////////////////////////////////////////////////DONE
router.post('/activity7/:userID/', function (req, res, next) {


    userID = req.params.userID;
    let currentUser = getUserInstance(userID);

    console.log(req.body.order)
    order = req.body.order
    var nameArr = order.split(',');
    console.log(nameArr);

    co(function* () {

        let client = yield MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        if(req.body.sec=="1:60"){
            time_taken="0:60";
        }else{
            time_taken=req.body.sec;
        }

        if(nameArr.length==1){
            console.log("Initialising default");
            nameArr=["government","industry","engineers","civilians","scientists","misinformation"];
        }

        var item = {
            "user": userID,
            "question": 6,
            "time_taken":time_taken,
            "extra_time_taken":req.body.extra,
            'sequence': nameArr
        };

        console.log(item);

        yield responseCol.insertOne(item);
        console.log('posted to db!')

    });

    co(function* () {

        yield snooze(1000)

        let client = yield MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        check = yield responseCol.findOne({"user": currentUser.id, "question": 6})

        if (check == null) {

            res.render('activity6', {
                time: null,
                userID: currentUser.id,
                question: 6,
                sequence: currentUser.question,
                error: "ERROR: Please answer all questions!"
            })

        } else {

            if (currentUser.question < 15) {
                
                res.render('activity7', {
                    time: 60,
                    userID: currentUser.id,
                    question: 7,
                    sequence: currentUser.question
                })
            } else {
                res.render('survey', {userID: currentUser.id})
            }

        }
    });

});

//////////////////////////////////////////////////////////////DONE
router.post('/activity11/:userID/', function (req, res, next) {


    userID = req.params.userID;
    let currentUser = getUserInstance(userID);

    console.log(req.body.order)
    order = req.body.order
    var nameArr = order.split(',');
    console.log(nameArr);

    co(function* () {

        let client = yield MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        if(req.body.sec=="1:60"){
            time_taken="0:60";
        }else{
            time_taken=req.body.sec;
        }

        var item = {
            "user": userID,
            "question": 10,
            "time_taken":time_taken,
            "extra_time_taken":req.body.extra,
            'sequence': nameArr
        };

        console.log(item);

        yield responseCol.insertOne(item);
        console.log('posted to db!')

    });

    co(function* () {

        yield snooze(1000)

        let client = yield MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        check = yield responseCol.findOne({"user": currentUser.id, "question": 10})

        if (check == null) {

            res.render('activity10', {
                time: 60,
                userID: currentUser.id,
                question: 10,
                sequence: currentUser.question,
                error: "ERROR: Please answer all questions!"
            })

        } else {

            if (currentUser.question < 15) {
                
                res.render('activity11', {
                    time: 60,
                    userID: currentUser.id,
                    question: 11,
                    sequence: currentUser.question
                })
            } else {
                res.render('survey', {userID: currentUser.id})
            }

        }
    });

});

//////////////////////////////////////////////////////////////DONE
router.post('/activity3/:userID/', function (req, res, next) {


    userID = req.params.userID;
    let currentUser = getUserInstance(userID);

    console.log(req.body.order)
    order = req.body.order
    var nameArr = order.split(',');
    console.log(nameArr);

    co(function* () {

        let client = yield MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        if(req.body.sec=="1:60"){
            time_taken="0:60";
        }else{
            time_taken=req.body.sec;
        }

        var item = {
            "user": userID,
            "question": 2,
            "time_taken":time_taken,
            "extra_time_taken":req.body.extra,
            'sequence': nameArr
        };

        console.log(item);

        yield responseCol.insertOne(item);
        console.log('posted to db!')

    });

    co(function* () {

        yield snooze(1000)

        let client = yield MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        check = yield responseCol.findOne({"user": currentUser.id, "question": 2})

        if (check == null) {

            res.render('activity2', {
                time: 60,
                userID: currentUser.id,
                question: 2,
                sequence: currentUser.question,
                error: "ERROR: Please answer all questions!"
            })

        } else {

            if (currentUser.question < 15) {
                
                res.render('activity3', {
                    time: 60,
                    userID: currentUser.id,
                    question: 3,
                    sequence: currentUser.question
                })
            } else {
                res.render('survey', {userID: currentUser.id})
            }

        }
    });

});

//////////////////////////////////////////////////////////////DONE
router.post('/activity14/:userID/', function (req, res, next) {


    userID = req.params.userID;
    let currentUser = getUserInstance(userID);

    console.log(req.body.order)
    order = req.body.order
    var nameArr = order.split(',');
    console.log(nameArr);

    co(function* () {

        if(req.body.sec=="1:60"){
            time_taken="0:60";
        }else{
            time_taken=req.body.sec;
        }

        let client = yield MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        var item = {
            "user": userID,
            "question": 13,
            "time_taken":time_taken,
            "extra_time_taken":req.body.extra,
            'sequence': nameArr
        };

        console.log(item);

        yield responseCol.insertOne(item);
        console.log('posted to db!')

    });

    co(function* () {

        yield snooze(1000)

        let client = yield MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        check = yield responseCol.findOne({"user": currentUser.id, "question": 13})

        if (check == null) {

            res.render('activity13', {
                time: 60,
                userID: currentUser.id,
                question: 13,
                sequence: currentUser.question,
                error: "ERROR: Please answer all questions!"
            })

        } else {

            if (currentUser.question < 15) {
                
                res.render('activity14', {
                    time: 60,
                    userID: currentUser.id,
                    question: 14,
                    sequence: currentUser.question
                })
            } else {
                res.render('survey', {userID: currentUser.id})
            }

        }
    });

});

//////////////////////////////////////////////////////////////DONE
router.post('/activity15/:userID/', function (req, res, next) {


    userID = req.params.userID;
    let currentUser = getUserInstance(userID);

    console.log(req.body.order)
    order = req.body.order
    var nameArr = order.split(',');
    console.log(nameArr);

    co(function* () {

        let client = yield MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        if(req.body.sec=="1:60"){
            time_taken="0:60";
        }else{
            time_taken=req.body.sec;
        }

        var item = {
            "user": userID,
            "question": 14,
            "time_taken":time_taken,
            "extra_time_taken":req.body.extra,
            'sequence': nameArr
        };

        console.log(item);

        yield responseCol.insertOne(item);
        console.log('posted to db!')

    });

    co(function* () {

        yield snooze(1000)

        let client = yield MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        check = yield responseCol.findOne({"user": currentUser.id, "question": 14})

        if (check == null) {

            res.render('activity14', {
                time: 60,
                userID: currentUser.id,
                question: 14,
                sequence: currentUser.question,
                error: "ERROR: Please answer all questions!"
            })

        } else {

            if (currentUser.question < 15) {
                
                res.render('activity15', {
                    userID: currentUser.id
                })
            } else {
                res.render('survey', {userID: currentUser.id})
            }

        }
    });

});

//////////////////////////////////////////////////////////////DONE
router.post('/activity4/:userID/', function (req, res, next) {


    userID = req.params.userID;
    let currentUser = getUserInstance(userID);

    console.log(req.body.order)
    order = req.body.order
    var nameArr = order.split(',');
    console.log(nameArr);

    co(function* () {

        let client = yield MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        if(req.body.sec=="1:60"){
            time_taken="0:60";
        }else{
            time_taken=req.body.sec;
        }

        var item = {
            "user": userID,
            "question": 3,
            "time_taken":time_taken,
            "extra_time_taken":req.body.extra,
            'sequence': nameArr
        };

        console.log(item);

        yield responseCol.insertOne(item);
        console.log('posted to db!')

    });

    co(function* () {

        yield snooze(1000)

        let client = yield MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        check = yield responseCol.findOne({"user": currentUser.id, "question": 3})

        if (check == null) {

            res.render('activity3', {
                time: 60,
                userID: currentUser.id,
                question: 3,
                sequence: currentUser.question,
                error: "ERROR: Please answer all questions!"
            })

        } else {

            if (currentUser.question < 15) {
                
                res.render('activity4', {
                    time: 60,
                    userID: currentUser.id,
                    question: 4,
                    sequence: currentUser.question
                })
            } else {
                res.render('survey', {userID: currentUser.id})
            }

        }
    });

});

//////////////////////////////////////////////////////////////DONE
router.post('/activity6/:userID/', function (req, res, next) {


    userID = req.params.userID;
    let currentUser = getUserInstance(userID);

    console.log(req.body.order)
    order = req.body.order
    var nameArr = order.split(',');
    console.log(nameArr);

    co(function* () {

        let client = yield MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        if(req.body.sec=="1:60"){
            time_taken="0:60";
        }else{
            time_taken=req.body.sec;
        }

        var item = {
            "user": userID,
            "question": 5,
            "time_taken":time_taken,
            "extra_time_taken":req.body.extra,
            'sequence': nameArr
        };

        console.log(item);

        yield responseCol.insertOne(item);
        console.log('posted to db!')

    });

    co(function* () {

        yield snooze(1000)

        let client = yield MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        check = yield responseCol.findOne({"user": currentUser.id, "question": 5})

        if (check == null) {

            res.render('activity5', {
                time: 60,
                userID: currentUser.id,
                question: 5,
                sequence: currentUser.question,
                error: "ERROR: Please answer all questions!"
            })

        } else {

            if (currentUser.question < 15) {
                
                res.render('activity6', {
                    time: 60,
                    userID: currentUser.id,
                    question: 6,
                    sequence: currentUser.question
                })
            } else {
                res.render('survey', {userID: currentUser.id})
            }

        }
    });

});

//////////////////////////////////////////////////////////////DONE
router.post('/activity10/:userID/', function (req, res, next) {


    userID = req.params.userID;
    let currentUser = getUserInstance(userID);

    console.log(req.body)

    co(function* () {

        let client = yield MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        if(req.body.sec=="1:60"){
            time_taken="1:30";
        }else{
            time_taken=req.body.sec;
        }

        var item = {
            "user": userID,
            "question": 9,
            "time_taken":time_taken,
            "extra_time_taken":req.body.extra,
            '%bisexual': req.body.bisexual,
            '%heterosexual':req.body.heterosexual,
            '%asexual':req.body.asexual,
            '%trans':req.body.trans,
            '%non-binary':req.body.non_binary,
            '%gay':req.body.gay,
            '%lesbian':req.body.lesbian,
        };

        console.log(item);

        yield responseCol.insertOne(item);
        console.log('posted to db!')

    });

    co(function* () {

        yield snooze(1000)

        let client = yield MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        check = yield responseCol.findOne({"user": currentUser.id, "question": 9})

        if (check == null) {

            res.render('activity9', {
                time: 90,
                userID: currentUser.id,
                question: 9,
                sequence: currentUser.question,
                error: "ERROR: Please answer all questions!"
            })

        } else {

            if (currentUser.question < 15) {
                
                res.render('activity10', {
                    time: 60,
                    userID: currentUser.id,
                    question: 10,
                    sequence: currentUser.question
                })
            } else {
                res.render('survey', {userID: currentUser.id})
            }

        }
    });

});

//////////////////////////////////////////////////////////////DONE
router.post('/activity8/:userID/', function (req, res, next) {


    userID = req.params.userID;
    let currentUser = getUserInstance(userID);

    console.log(req.body)

    co(function* () {

        let client = yield MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        if(req.body.sec=="1:60"){
            time_taken="1:30";
        }else{
            time_taken=req.body.sec;
        }

        var item = {
            "user": userID,
            "question": 7,
            "time_taken":time_taken,
            "extra_time_taken":req.body.extra,
            '%white': req.body.white,
            '%moroccan':req.body.moroccan,
            '%lebanese':req.body.lebanese,
            '%european':req.body.european,
            '%arab':req.body.arab,
            '%asian':req.body.asian,
            '%american_indian':req.body.american_indian,
            '%two_or_more_races':req.body.two_or_more,
            '%pacific_islander':req.body.islander,
            '%hispanic':req.body.hispanic,
            '%black':req.body.black,
        };

        console.log(item);

        yield responseCol.insertOne(item);
        console.log('posted to db!')

    });

    co(function* () {

        yield snooze(1000)

        let client = yield MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        check = yield responseCol.findOne({"user": currentUser.id, "question": 7})

        if (check == null) {

            res.render('activity7', {
                time: 90,
                userID: currentUser.id,
                question: 7,
                sequence: currentUser.question,
                error: "ERROR: Please answer all questions!"
            })

        } else {   
                res.render('activity8', {
                    time: 90,
                    userID: currentUser.id,
                    question: 8,
                    sequence: currentUser.question
                })
        }
    });

});

router.post('/end/:userID', function (req, res, next) {

    //collect variables from front end
    userID = req.params.userID;

    console.log(req.body)
    // key = req.body.key;
    // userDemographic = req.body.userDemographic;
    // userDemographic = JSON.parse(userDemographic);

    //storesurvey results
    if(req.body.no==null){
        var arr = [req.body.year_of_birth,req.body.place_of_birth,req.body.place_of_residence,req.body.gender,req.body.political_spectrum,req.body.topic,req.body.feedback]
    } else{
        var arr = [req.body.year_of_birth,req.body.place_of_birth,req.body.place_of_residence,req.body.gender,"undisclosed",req.body.topic,req.body.feedback]
    }

    var all = ["lgbtq_community","race","workforce","body_weight","climate_change","future","getting_older","security","relationships"];
    var topics = arr[5];
    var political = arr[4];

    if(topics==null){
        if(req.body.verdict=='all_uncomfortable'){
            topics = all;
        } else if(req.body.verdict=="all_comfortable"){
            topics = "did not find any topics uncomfortable";
        } else{
            topics = "did not answer question properely";
        }
    } else{
        topics = req.body.topic;
    }

    if(req.body.political_spectrum==""){
        political = "5";
    }

    userDemographic={
        'year_of_birth':arr[0],
        'country_birth':req.body.p1,
        'state_birth':req.body.p2,
        'state_residence':req.body.p3,
        'gender':arr[3],
        'political_identification':political,
        'uncomfortable_topics':topics,
        'feedback':arr[6]
    }
    
    co(function* () {
        let client = yield MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = client.db(datab)
        let UsersCol = db.collection('users')

        function makeid(length) {
            var result           = '';
            var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            var charactersLength = characters.length;
            for ( var i = 0; i < length; i++ ) {
              result += characters.charAt(Math.floor(Math.random() * 
         charactersLength));
           }
           return result;
        }
        key = makeid(5)
        console.log("Key to Pay: "+key);

        newItem = {
            "surveyResults": userDemographic,
            "key2pay": key
        }

        console.log(newItem);

        UsersCol.updateOne({"user": userID}, {$set: newItem});
        console.log('User Completed task')

        res.render('end',{payment_key:key});
    })

})

module.exports = router;
