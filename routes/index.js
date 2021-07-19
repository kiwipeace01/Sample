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

        let client = yield MongoClient.connect(url);
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
                time: 90,
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


router.post('/activity2/:userID/', function (req, res, next) {

    //Fetch current user
    userID = req.params.userID;
    let currentUser = getUserInstance(userID);
    // console.log(currentUser);

    console.log(req.body)
    // group = JSON.parse(group)
    // console.log(group)

    // prevTime = currentUser.getPrevTime()

    currentUser.setPrevTime(req.body.time)
        time = 60 - req.body.time;


    co(function* () {

        let client = yield MongoClient.connect(url);
        const db = client.db(datab)
        let responseCol = db.collection('responses');

        if(req.body.sec=="1:60"){
            time_taken="1:30";
        }else{
            time_taken=req.body.sec;
        }

        var item = {
            "user": userID,
            "question": 1,
            "time_taken":time_taken,
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


        yield responseCol.insertOne(item);
        console.log('posted to db!')

    });

    // prevTime = currentUser.getPrevTime()

    //check to ensure previous response was posted
    co(function* () {

        yield snooze(1000)

        let client = yield MongoClient.connect(url);
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        check = yield responseCol.findOne({"user": currentUser.id, "question": 1})

        if (check == null) {

            res.render('activity1', {
                time: null,
                userID: currentUser.id,
                question: 1,
                sequence: currentUser.question,
                error: "ERROR: Please answer all questions!"
            })

        } else {

            // currentUser.nextquestion()

            // questionNum = currentUser.selectQuestion()

            // console.log(questionNum)
            // console.log("Question number selected: "+questionNum)

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

router.post('/activity3/:userID/', function (req, res, next) {


    userID = req.params.userID;
    let currentUser = getUserInstance(userID);

    console.log(req.body.order)
    order = req.body.order
    var nameArr = order.split(',');
    console.log(nameArr);

    co(function* () {

        let client = yield MongoClient.connect(url);
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
            "question": 2,
            "time_taken":time_taken,
            'sequence': nameArr
        };

        console.log(item);

        yield responseCol.insertOne(item);
        console.log('posted to db!')

    });

    co(function* () {

        yield snooze(1000)

        let client = yield MongoClient.connect(url);
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        check = yield responseCol.findOne({"user": currentUser.id, "question": 2})

        if (check == null) {

            res.render('activity2', {
                time: null,
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

router.post('/activity4/:userID/', function (req, res, next) {


    userID = req.params.userID;
    let currentUser = getUserInstance(userID);

    console.log(req.body.order)
    order = req.body.order
    var nameArr = order.split(',');
    console.log(nameArr);

    co(function* () {

        let client = yield MongoClient.connect(url);
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
            "question": 3,
            "time_taken":time_taken,
            'sequence': nameArr
        };

        console.log(item);

        yield responseCol.insertOne(item);
        console.log('posted to db!')

    });

    co(function* () {

        yield snooze(1000)

        let client = yield MongoClient.connect(url);
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        check = yield responseCol.findOne({"user": currentUser.id, "question": 3})

        if (check == null) {

            res.render('activity3', {
                time: null,
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

router.post('/activity5/:userID/', function (req, res, next) {


    userID = req.params.userID;
    let currentUser = getUserInstance(userID);

    console.log(req.body.order)
    order = req.body.order
    var nameArr = order.split(',');
    console.log(nameArr);

    co(function* () {

        let client = yield MongoClient.connect(url);
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
            "question": 4,
            "time_taken":time_taken,
            'sequence': nameArr
        };

        console.log(item);

        yield responseCol.insertOne(item);
        console.log('posted to db!')

    });

    co(function* () {

        yield snooze(1000)

        let client = yield MongoClient.connect(url);
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        check = yield responseCol.findOne({"user": currentUser.id, "question": 4})

        if (check == null) {

            res.render('activity4', {
                time: null,
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

router.post('/activity6/:userID/', function (req, res, next) {


    userID = req.params.userID;
    let currentUser = getUserInstance(userID);

    console.log(req.body.order)
    order = req.body.order
    var nameArr = order.split(',');
    console.log(nameArr);


    co(function* () {

        let client = yield MongoClient.connect(url);
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
            "question": 5,
            "time_taken":time_taken,
            'sequence': nameArr
        };

        console.log(item);

        yield responseCol.insertOne(item);
        console.log('posted to db!')

    });

    co(function* () {

        yield snooze(1000)

        let client = yield MongoClient.connect(url);
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        check = yield responseCol.findOne({"user": currentUser.id, "question": 5})

        if (check == null) {

            res.render('activity5', {
                time: null,
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

router.post('/activity7/:userID/', function (req, res, next) {


    userID = req.params.userID;
    let currentUser = getUserInstance(userID);

    console.log(req.body.order)
    order = req.body.order
    var nameArr = order.split(',');
    console.log(nameArr);

    co(function* () {

        let client = yield MongoClient.connect(url);
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        if(req.body.sec=="1:60"){
            time_taken="0:60";
        }else{
            time_taken=req.body.sec;
        }

        if(nameArr.length==1){
            console.log("Initialising default");
            nameArr=["government","industry","business_people","civilians","scientists","misinformation"];
        }

        var item = {
            "user": userID,
            "question": 6,
            "time_taken":time_taken,
            'sequence': nameArr
        };

        console.log(item);

        yield responseCol.insertOne(item);
        console.log('posted to db!')

    });

    co(function* () {

        yield snooze(1000)

        let client = yield MongoClient.connect(url);
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

router.post('/activity8/:userID/', function (req, res, next) {


    userID = req.params.userID;
    let currentUser = getUserInstance(userID);

    console.log(req.body.order)
    order = req.body.order
    var nameArr = order.split(',');
    console.log(nameArr);

    co(function* () {

        let client = yield MongoClient.connect(url);
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        if(req.body.sec=="1:60"){
            time_taken="0:60";
        }else{
            time_taken=req.body.sec;
        }

        var item = {
            "user": userID,
            "question": 7,
            "time_taken":time_taken,
            'sequence': nameArr
        };

        console.log(item);

        yield responseCol.insertOne(item);
        console.log('posted to db!')

    });

    co(function* () {

        yield snooze(1000)

        let client = yield MongoClient.connect(url);
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        check = yield responseCol.findOne({"user": currentUser.id, "question": 7})

        if (check == null) {

            res.render('activity7', {
                time: null,
                userID: currentUser.id,
                question: 7,
                sequence: currentUser.question,
                error: "ERROR: Please answer all questions!"
            })

        } else {

            if (currentUser.question < 15) {
                
                res.render('activity8', {
                    time: 60,
                    userID: currentUser.id,
                    question: 8,
                    sequence: currentUser.question
                })
            } else {
                res.render('survey', {userID: currentUser.id})
            }

        }
    });

});

router.post('/activity9/:userID/', function (req, res, next) {


    userID = req.params.userID;
    let currentUser = getUserInstance(userID);

    console.log(req.body.order)
    order = req.body.order
    var nameArr = order.split(',');
    console.log(nameArr);

    co(function* () {

        let client = yield MongoClient.connect(url);
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        if(req.body.sec=="1:60"){
            time_taken="0:60";
        }else{
            time_taken=req.body.sec;
        }

        var item = {
            "user": userID,
            "question": 8,
            "time_taken":time_taken,
            'sequence': nameArr
        };

        console.log(item);

        yield responseCol.insertOne(item);
        console.log('posted to db!')

    });

    co(function* () {

        yield snooze(1000)

        let client = yield MongoClient.connect(url);
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        check = yield responseCol.findOne({"user": currentUser.id, "question": 8})

        if (check == null) {

            res.render('activity8', {
                time: null,
                userID: currentUser.id,
                question: 8,
                sequence: currentUser.question,
                error: "ERROR: Please answer all questions!"
            })

        } else {

            if (currentUser.question < 15) {
                
                res.render('activity9', {
                    time: 60,
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

router.post('/activity10/:userID/', function (req, res, next) {


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

        let client = yield MongoClient.connect(url);
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        var item = {
            "user": userID,
            "question": 9,
            "time_taken":time_taken,
            'sequence': nameArr
        };

        console.log(item);

        yield responseCol.insertOne(item);
        console.log('posted to db!')

    });

    co(function* () {

        yield snooze(1000)

        let client = yield MongoClient.connect(url);
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        check = yield responseCol.findOne({"user": currentUser.id, "question": 9})

        if (check == null) {

            res.render('activity9', {
                time: null,
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

router.post('/activity11/:userID/', function (req, res, next) {


    userID = req.params.userID;
    let currentUser = getUserInstance(userID);

    console.log(req.body.order)
    order = req.body.order
    var nameArr = order.split(',');
    console.log(nameArr);

    co(function* () {

        let client = yield MongoClient.connect(url);
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
            'sequence': nameArr
        };

        console.log(item);

        yield responseCol.insertOne(item);
        console.log('posted to db!')

    });

    co(function* () {

        yield snooze(1000)

        let client = yield MongoClient.connect(url);
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        check = yield responseCol.findOne({"user": currentUser.id, "question": 10})

        if (check == null) {

            res.render('activity10', {
                time: null,
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

router.post('/activity12/:userID/', function (req, res, next) {


    userID = req.params.userID;
    let currentUser = getUserInstance(userID);

    console.log(req.body.order)
    order = req.body.order
    var nameArr = order.split(',');
    console.log(nameArr);

    co(function* () {

        let client = yield MongoClient.connect(url);
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        if(req.body.sec=="1:60"){
            time_taken="0:60";
        }else{
            time_taken=req.body.sec;
        }

        var item = {
            "user": userID,
            "question": 11,
            "time_taken":time_taken,
            'sequence': nameArr
        };

        console.log(item);

        yield responseCol.insertOne(item);
        console.log('posted to db!')

    });

    co(function* () {

        yield snooze(1000)

        let client = yield MongoClient.connect(url);
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        check = yield responseCol.findOne({"user": currentUser.id, "question": 11})

        if (check == null) {

            res.render('activity11', {
                time: null,
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

router.post('/activity13/:userID/', function (req, res, next) {


    userID = req.params.userID;
    let currentUser = getUserInstance(userID);

    console.log(req.body.order)
    order = req.body.order
    var nameArr = order.split(',');
    console.log(nameArr);

    co(function* () {

        let client = yield MongoClient.connect(url);
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        if(req.body.sec=="1:60"){
            time_taken="0:60";
        }else{
            time_taken=req.body.sec;
        }

        var item = {
            "user": userID,
            "question": 12,
            "time_taken":time_taken,
            'sequence': nameArr
        };

        console.log(item);

        yield responseCol.insertOne(item);
        console.log('posted to db!')

    });

    co(function* () {

        yield snooze(1000)

        let client = yield MongoClient.connect(url);
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        check = yield responseCol.findOne({"user": currentUser.id, "question": 12})

        if (check == null) {

            res.render('activity12', {
                time: null,
                userID: currentUser.id,
                question: 12,
                sequence: currentUser.question,
                error: "ERROR: Please answer all questions!"
            })

        } else {

            if (currentUser.question < 15) {
                
                res.render('activity13', {
                    time: 90,
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

router.post('/activity14/:userID/', function (req, res, next) {


    userID = req.params.userID;
    let currentUser = getUserInstance(userID);

    console.log(req.body)

    co(function* () {

        let client = yield MongoClient.connect(url);
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        if(req.body.sec=="1:60"){
            time_taken="1:30";
        }else{
            time_taken=req.body.sec;
        }

        var item = {
            "user": userID,
            "question": 13,
            "time_taken":time_taken,
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

        let client = yield MongoClient.connect(url);
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        check = yield responseCol.findOne({"user": currentUser.id, "question": 13})

        if (check == null) {

            res.render('activity13', {
                time: null,
                userID: currentUser.id,
                question: 13,
                sequence: currentUser.question,
                error: "ERROR: Please answer all questions!"
            })

        } else {

            if (currentUser.question < 15) {
                
                res.render('activity14', {
                    time: 90,
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

router.post('/activity15/:userID/', function (req, res, next) {


    userID = req.params.userID;
    let currentUser = getUserInstance(userID);

    console.log(req.body)

    co(function* () {

        let client = yield MongoClient.connect(url);
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        if(req.body.sec=="1:60"){
            time_taken="1:30";
        }else{
            time_taken=req.body.sec;
        }

        var item = {
            "user": userID,
            "question": 14,
            "time_taken":time_taken,
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

        let client = yield MongoClient.connect(url);
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        check = yield responseCol.findOne({"user": currentUser.id, "question": 14})

        if (check == null) {

            res.render('activity14', {
                time: null,
                userID: currentUser.id,
                question: 14,
                sequence: currentUser.question,
                error: "ERROR: Please answer all questions!"
            })

        } else {   
                res.render('activity15', {
                    userID: currentUser.id
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
        'place_of_birth':arr[1],
        'place_of_residence':arr[2],
        'gender':arr[3],
        'political_identification':political,
        'uncomfortable_topics':topics,
        'feedback':arr[6]
    }
    
    co(function* () {
        let client = yield MongoClient.connect(url);
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

// router.post('/activity/:userID/', function (req, res, next) {

//     //Fetch current user
//     let currentUser = getUserInstance(req.params.userID);
//     prevTime = currentUser.getPrevTime()

//     //check to ensure previous response was posted
//     co(function* () {

//         yield snooze(1000)

//         let client = yield MongoClient.connect(url);
//         const db = client.db(datab)
//         let responseCol = db.collection('responses')

//         check = yield responseCol.findOne({"user": currentUser.id, "question": currentUser.currentQ()})

//         if (check == null) {

//             res.render('activity', {
//                 time: prevTime - 1,
//                 userID: currentUser.id,
//                 question: currentUser.currentQ(),
//                 sequence: currentUser.question,
//                 error: "ERROR: Please answer all questions!"
//             })

//         } else {

//             currentUser.nextquestion()

//             questionNum = currentUser.selectQuestion()

//             console.log(questionNum)
//             console.log("Question number selected: "+questionNum)

//             if (currentUser.question < 15) {
//                 res.render('activity', {
//                     time: 60,
//                     userID: currentUser.id,
//                     question: questionNum,
//                     sequence: currentUser.question
//                 })
//             } else {
//                 res.render('survey', {userID: currentUser.id})
//             }

//         }
//     });

// });


//
//Store data
//

// router.post('/activity1/:userID/data', function (req, res, next) {

//     userID = req.params.userID;

//     console.log("Inside POST for userID/data of activity 1")

//     let currentUser = getUserInstance(userID);

//     question = 1

//     console.log(req.body)


//     let group = Object.keys(req.body)
//     console.log(group)
//     group = JSON.parse(group)
//     console.log(group)


//     group[2] = group[2].substring(0, group[2].length - 1);
//     group[2] = parseInt(group[2])
//     console.log(group)

//     TimeLeft = group[0]
//     currentUser.setPrevTime(TimeLeft)
//     time = 60 - TimeLeft

//     console.log('timeLeft  ', TimeLeft)
//     console.log('time spent  ', time)

//     //store response in db
//     co(function* () {

//         let client = yield MongoClient.connect(url);
//         const db = client.db(datab)
//         let responseCol = db.collection('responses')

//         var item = {
//             "user": userID,
//             "question": question,
//             "time": time,
//             "q1": group[1],
//             "q2": group[2],
//             "q3": group[3],
//             "x": group[4],
//             "y": group[5]
//         };

//         if (group[1] != -2 && group[3] != -2) {

//             yield responseCol.insertOne(item);
//             console.log('posted to db!')

//         } else {
//             console.log("invalid inuput, retry")
//         }

//     });

// });

// router.post('/activity/:userID/data', function (req, res, next) {

//     userID = req.params.userID;

//     let currentUser = getUserInstance(userID);

//     question = currentUser.currentQ()

//     let group = Object.keys(req.body)
//     group = JSON.parse(group)

//     group[2] = group[2].substring(0, group[2].length - 1);
//     group[2] = parseInt(group[2])
//     console.log(group)

//     TimeLeft = group[0]
//     currentUser.setPrevTime(TimeLeft)
//     time = 60 - TimeLeft

//     console.log('timeLeft  ', TimeLeft)
//     console.log('time spent  ', time)

//     //store response in db
//     co(function* () {

//         let client = yield MongoClient.connect(url);
//         const db = client.db(datab)
//         let responseCol = db.collection('responses')

//         var item = {
//             "user": userID,
//             "question": question,
//             "time": time,
//             "q1": group[1],
//             "q2": group[2],
//             "q3": group[3],
//             "x": group[4],
//             "y": group[5]
//         };

//         if (group[1] != -2 && group[3] != -2) {

//             yield responseCol.insertOne(item);
//             console.log('posted to db!')

//         } else {
//             console.log("invalid inuput, retry")
//         }

//     });

// });

router.post('/activity/:use/:userID/data', function (req, res, next) {

    userID = req.params.userID;

    let currentUser = getUserInstance(userID);

    question = currentUser.currentQ()

    let group = Object.keys(req.body)
    group = JSON.parse(group)

    group[2] = group[2].substring(0, group[2].length - 1);
    group[2] = parseInt(group[2])
    console.log(group)

    TimeLeft = group[0]
    currentUser.setPrevTime(TimeLeft)
    time = 60 - TimeLeft

    console.log('timeLeft  ', TimeLeft)
    console.log('time spent  ', time)

    //store response in db
    co(function* () {

        let client = yield MongoClient.connect(url);
        const db = client.db(datab)
        let responseCol = db.collection('responses')

        var item = {
            "user": userID,
            "question": question,
            "time": time,
            "q1": group[1],
            "q2": group[2],
            "q3": group[3],
            "x": group[4],
            "y": group[5]
        };

        if (group[1] != -2 && group[3] != -2) {

            yield responseCol.insertOne(item);
            console.log('posted to db!')

        } else {
            console.log("invalid inuput, retry")
        }

    });

});


//
//Load survey page
//


router.post('/survey/:userID', function(req,res,next){

  //Fetch current user
  let currentUser = getUserInstance(req.params.userID);
  res.render('survey', {userID: currentUser.id})

});






//
//Store survery response
//


// router.post('/activity/:use/:userID/sendSurvey', function (req, res, next) {

//     //collect variables from front end
//     userID = req.params.userID;
//     key = req.body.key;
//     userDemographic = req.body.userDemographic;
//     userDemographic = JSON.parse(userDemographic);

//     //storesurvey results
//     co(function* () {
//         let client = yield MongoClient.connect(url);
//         const db = client.db(datab)
//         let UsersCol = db.collection('users')

//         newItem = {
//             "surveyResults": userDemographic,
//             "key2pay": key
//         }

//         UsersCol.updateOne({"user": userID}, {$set: newItem});
//         console.log('User Completed task')
//     })

//     //give a response to load next page
//     res.send("{}");

// })

module.exports = router;
