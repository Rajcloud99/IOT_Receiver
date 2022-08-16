module.exports = {
    "host":"IP",
    "cronJobs" :{
        "dailyKM" :{
            "time" : '00 00 04 * * *'
        }
    },
    "lms":{
        lmsService:true,
        host:"13.235.119.20",
        port:"3002",
        userAllowedForLiveFeedForAll:true,
        userAllowedForTripForAll:true,
        server_intercommunication_key:"eyJrZXkiOiJncHNnYWFkaSIsInRpbWUiOjE1MjIwMTA0OTgxNjJ9.0kD2fPtK2cybSL1rU51_azToU_SEr_TcNXPOzKgUxyA"
    }
};
