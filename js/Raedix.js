var myRaedix = function($http) {
    return {
        key: null,
        bf: null,
        token: null,
        gameToken: null,
        matchToken: null,
        register: {},
        matchmaking: {},
        cipherLogin: null,
        cipherRegister: null,
        cipherMatchmaking: null,
        cipherMatch: null,
        gameData: null,
        userData: {},
        promise: null,
        server: "http://api.raedixgames.com",



        initialize: function(rootObject) {
            rootObject.promise = $http.get(rootObject.server + "/requestkey").success(function(data) {
                console.log(data.key);
                rootObject.bf = new Blowfish(data.key);

            });
            $http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
            $http.defaults.transformRequest = [

                function(data) {
                    /**
                     * The workhorse; converts an object to x-www-form-urlencoded serialization.
                     * @param {Object} obj
                     * @return {String}
                     */
                    var param = function(obj) {
                        var query = '';
                        var name, value, fullSubName, subName, subValue, innerObj, i;

                        for (name in obj) {
                            value = obj[name];

                            if (value instanceof Array) {
                                for (i = 0; i < value.length; ++i) {
                                    subValue = value[i];
                                    fullSubName = name + '[' + i + ']';
                                    innerObj = {};
                                    innerObj[fullSubName] = subValue;
                                    query += param(innerObj) + '&';
                                }
                            } else if (value instanceof Object) {
                                for (subName in value) {
                                    subValue = value[subName];
                                    fullSubName = name + '[' + subName + ']';
                                    innerObj = {};
                                    innerObj[fullSubName] = subValue;
                                    query += param(innerObj) + '&';
                                }
                            } else if (value !== undefined && value !== null) {
                                query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
                            }
                        }

                        return query.length ? query.substr(0, query.length - 1) : query;
                    };

                    return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
                }
            ];
            //this.promises.push(promise);
        },

        setLogin: function(rootObject, username, password, gameid) {

            rootObject.cipherLogin = rootObject.bf.encrypt(JSON.stringify({
                'username': username,
                'password': password,
                'gameid': gameid
            }));
            rootObject.userData.username = username;
        },

        setRegister: function(rootObject, username, email, password) {
            rootObject.cipherRegister = this.bf.encrypt(JSON.stringify({
                'username': username,
                'password': password,
                'email': email
            }));
        },

        setMatchmaking: function(rootObject, gameid, numPlayers) {
            rootObject.cipherMatchmaking = this.bf.encrypt(JSON.stringify({
                'token': rootObject.token,
                'gameid': gameid,
                'numberplayers': numPlayers
            }));

        },

        sendLogin: function(rootObject) {
            rootObject.promise = $http.post(rootObject.server + "/login/", {
                'encdata': rootObject.cipherLogin
            }).success(function(data) {
                console.log(data);
                data = rootObject.bf.decrypt(data.encdata); // decrypts encdata and makes it the default data object
                try {
                    data = JSON.parse(data);
                } catch (err) {
                    data += '}';
                    data = JSON.parse(data);
                }
                if (data.result === 'Fail') {
                    console.log(data.error);
                } else {
                    rootObject.token = data.token;
                    console.log(rootObject.token);
                }

            });


        },

        sendRegister: function(rootObject) {
            // Register an account. All data should be encrypted and sent via encdata object
            rootObject.promise = $http.post(rootObject.server + "/register", {
                encdata: rootObject.cipherRegister
            }).success(function(data) {
                data = rootObject.bf.decrypt(data.encdata); // decrypts encdata and makes it the default data object
                try {
                    data = JSON.parse(data);
                } catch (err) {
                    data += '}';
                    data = JSON.parse(data);
                }
                console.log(data);
            }, 'json');

        },

        sendMatchmaking: function(rootObject) {
            rootObject.promise = $http.post(rootObject.server + "/joinmatchmaking", {
                encdata: this.cipherMatchmaking
            }).success(function(data) {
                data = rootObject.bf.decrypt(data.encdata); // decrypts encdata and makes it the default data object
                try {
                    data = JSON.parse(data);
                } catch (err) {
                    data += '}';
                    data = JSON.parse(data);
                }
                console.log(data);
                rootObject.matchToken = data.matchToken;
                rootObject.cipherMatch = rootObject.bf.encrypt(JSON.stringify({
                    'matchToken': rootObject.matchToken
                }));

            }, 'json');


        },

        sendMove: function(rootObject, gameToken, board) {
            var cipherData = {
                'gameToken': gameToken,
                'board': board,
                'token': rootObject.token
            };
            cipherData = rootObject.bf.encrypt(JSON.stringify(cipherData));
            rootObject.promise = $http.post(rootObject.server + "/makemove", {
                encdata: cipherData
            }).success(function(data) {
                data = rootObject.bf.decrypt(data.encdata); // decrypts encdata and makes it the default data object
                try {
                    data = JSON.parse(data);
                } catch (err) {
                    data += '}';
                    data = JSON.parse(data);
                }
                if (data.winner != null) {
                    rootObject.gameData.winner = data.winner;
                } else {
                    console.log(data.currentplayer);
                    rootObject.gameData.currentplayer = data.currentplayer;
                }
                console.log(data);
            }, 'json');

        },

        checkMatchmaking: function(rootObject) {
            rootObject.promise = $http.post(rootObject.server + "/checkmatchmaking", {
                encdata: rootObject.cipherMatch
            })
                .success(function(data) {
                    data = rootObject.bf.decrypt(data.encdata); // decrypts encdata and makes it the default data object
                    try {
                        data = JSON.parse(data);
                    } catch (err) {
                        data += '}';
                        data = JSON.parse(data);
                    }
                    if (data.result === 'Success') {
                        rootObject.gameToken = data.gameToken;
                        rootObject.matchToken = null;
                    }
                    console.log(data);
                }, 'json');

        },
        getGame: function(rootObject, gameToken) {
            var cipherData = {
                'gameToken': gameToken
            };
            cipherData = rootObject.bf.encrypt(JSON.stringify(cipherData));
            rootObject.promise = $http.post(rootObject.server + "/getgame", {
                encdata: cipherData
            })
                .success(function(data) {
                    data = rootObject.bf.decrypt(data.encdata); // decrypts encdata and makes it the default data object
                    try {
                        data = JSON.parse(data);
                    } catch (err) {
                        data += '}';
                        data = JSON.parse(data);
                    }
                    if (data.result === 'Success') {
                        rootObject.gameData = data;
                    }
                    console.log(data);
                });

        },
        endGame: function(rootObject, gameToken, token, winner) {
            var cipherData = {
                'gameToken': gameToken,
                'token': token,
                'winner': winner
            };
            cipherData = rootObject.bf.encrypt(JSON.stringify(cipherData));
            rootObject.promise = $http.post(rootObject.server + "/endgame", {
                encdata: cipherData
            })
                .success(function(data) {
                    data = rootObject.bf.decrypt(data.encdata); // decrypts encdata and makes it the default data object
                    console.log(data);
                    try {
                        data = JSON.parse(data);
                    } catch (err) {
                        data += '}';
                        data = JSON.parse(data);
                    }

                    if (data.result === 'Success') {
                        rootObject.gameData.winner = winner;
                    }
                    console.log(data);
                });
        }
    };
};

