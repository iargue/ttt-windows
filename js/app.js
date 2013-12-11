
(function() {
	"use-strict";

	var TicTacTorrent = angular.module('ticTacTorrent', ['hammer', 'angular-loading-bar', 'ngAnimate']);

	TicTacTorrent.service('Raedix', ['$http', myRaedix]);

	TicTacTorrent.controller('gameCtrl', function($scope, $timeout, $q, Raedix) {
		// Holds game instance specific data.
		var dataConstructor = function() {
			return {
				showMenu: true,
				showBoard: false,
				gameActive: false,
				gameWin: false,
				gameDraw: false,
				playComp: false,
				curPlayer: 0,
				winPlayer: -1,
				numWin: 3,
				multiplayer: 1,
				players: [

				],
				artificialIntelligence: new ArtificialIntelligence(1),
				grid: [
					[-1, -1, -1],
					[-1, -1, -1],
					[-1, -1, -1],
				],
				size: 3
			};
		};
		$scope.data = dataConstructor();

		// Resizes the game grid.
		$scope.resizeGrid = function(dir) {
			if (dir == 1 && $scope.data.size < 6) $scope.data.size++;
			if (dir == 0 && $scope.data.size > 3) $scope.data.size--;
			$scope.data.grid = [];
			for (var i = 0, len = $scope.data.size; i < len; i++) {
				$scope.data.grid.push([]);
				for (var j = 0; j < len; j++) {
					$scope.data.grid[i].push(-1);
				}
			}
		};

		$scope.changeViews = function(menu) {
			if (menu) {
				$scope.data.gameWin = false;
				$scope.data.gameDraw = false;
				$scope.data.showBoard = false;
				$scope.data.showMenu = true;
				$scope.data.gameActive = false;
				$timeout(function() {
					$scope.data = dataConstructor();
				}, 500);
			} else {
				$scope.data.showMenu = false;
				$scope.data.showBoard = true;
				$scope.data.gameActive = true;
				$timeout(multiplayerTick, 1000);
			}
		};



		var multiplayerTick = function() {
			if ($scope.data.multiplayer !== 1 || $scope.data.gameActive === false) return;
			//console.log(Raedix);

			if (Raedix.bf === null) {
				Raedix.initialize(Raedix);
			}

			$q.all(Raedix.promise).then(function() {
				if (Raedix.token === null) {
					Raedix.setLogin(Raedix, 'test', 'P@ssw0rd', '001');
					Raedix.sendLogin(Raedix);
				}

			});
			$q.all(Raedix.promise).then(function() {
				if (Raedix.token !== null && Raedix.matchToken === null && Raedix.gameToken === null) {
					Raedix.setMatchmaking(Raedix, '001', '2');
					Raedix.sendMatchmaking(Raedix);
				}
			});

			$q.all(Raedix.promise).then(function() {
				if (Raedix.matchToken !== null) {
					Raedix.checkMatchmaking(Raedix);
				}
			});

			$q.all(Raedix.promise).then(function() {
				if (Raedix.gameToken !== null && Raedix.gameData === null) {
					Raedix.getGame(Raedix, Raedix.gameToken);
					$scope.data.players = JSON.parse(Raedix.gameData.playerarray);
					for (var x = 0; x < 2; x++) {
						if ($scope.data.players[x] === Raedix.userData.username) $scope.data.me = x;
					}
					$scope.data.curPlayer = Raedix.gameData.currentplayer;
				}
			});

			$q.all(Raedix.promise).then(function() {
				if (Raedix.gameData !== null && Raedix.gameData.currentplayer !== $scope.data.me) {
					Raedix.getGame(Raedix, Raedix.gameToken);
				}
				if (Raedix.gameData !== null && Raedix.gameData.currentplayer === $scope.data.me) {
					console.log(Raedix.gameData.board);
					if (Raedix.gameData.board !== 'null') $scope.multiplayerMove();

				}
			});

			setTimeout(multiplayerTick, 1000);
		};



		$scope.plTurn = function(test) {
			if (!$scope.data.gameActive) return false;
			if (test === $scope.data.curPlayer) return true;
			else return false;
		};

		$scope.aimove = function() {
			var move = $scope.data.artificialIntelligence.calculateMove($scope.data.grid);
			$scope.playerMove(move[1], move[0]);
		};

		$scope.multiplayerMove = function() {
			$scope.data.grid = JSON.parse(Raedix.gameData.board);
			$scope.$digest();
			checkStatus(
				Logic.gridState(
					$scope.data.curPlayer,
					$scope.data.numWin,
					$scope.data.grid,
					$scope.data.size
				)
			);
			$scope.$digest();

			$scope.data.curPlayer = Raedix.gameData.currentplayer;
		};

		$scope.playerMove = function(x, y) {
			if ($scope.data.grid[x][y] === -1 && $scope.data.gameActive) {
				if ($scope.data.multiplayer === 1 && Raedix.gameData.currentplayer !== $scope.data.me) return;

				$scope.data.grid[x][y] = $scope.data.curPlayer;

				checkStatus(
					Logic.gridState(
						$scope.data.curPlayer,
						$scope.data.numWin,
						$scope.data.grid,
						$scope.data.size
					)
				);

				if ($scope.data.multiplayer === 1) {
					Raedix.sendMove(Raedix.gameToken, JSON.stringify($scope.data.grid));
					$scope.data.curPlayer = Raedix.gameData.currentplayer;
				}

				if ($scope.data.multiplayer === 0) {
					if ($scope.data.curPlayer === 1) {
						$scope.data.curPlayer = 0;
					} else {
						$scope.data.curPlayer = 1;
						if ($scope.data.playComp) $timeout(function() {
							$scope.aimove();
						}, 800);
					}
				}

			}

		};

		// Updates the view to show X's and O's if grid elements have been selected.
		$scope.selected = function(type, x, y) {
			if ($scope.data.grid[x][y] === 0 && type === 0) return true;
			if ($scope.data.grid[x][y] === 1 && type === 1) return true;
			return false;
		};


		// Checks to see if the win state has been satisfied.
		var checkStatus = function(winState) {
			if (winState === -1) return;
			else {
				if (winState === -2) {
					$scope.data.gameDraw = true;
					if ($scope.data.multiplayer === 1) {
						Raedix.endGame(Raedix.gameToken, Raedix.token, 'Draw');
					}
				} else {
					if ($scope.data.multiplayer === 1) {
						Raedix.endGame(Raedix.gameToken, Raedix.token, $scope.data.players[winState]);
					}
					$scope.data.gameWin = true;
					$scope.data.winPlayer = winState;
				}
				$scope.data.gameActive = false;
			}
		};
	});

})();

var Logic = {
	gridState: function(player, numWin, grid, size) {
		var numConnected = null;
		var numZero = 0;
		var x = 0;
		var y = 0;
		for (x = 0; x < size; x++) {
			numConnected = 0;
			for (y = 0; y < size; y++) {
				if (grid[x][y] === 0) numZero++;
				if (grid[x][y] === player) numConnected++;
				else numConnected = 0;
				if (numConnected === numWin) return player;
			}
		}
		numConnected = 0;
		for (y = 0; y < size; y++) {
			numConnected = 0;
			for (x = 0; x < size; x++) {
				if (grid[x][y] === 0) numZero++;
				if (grid[x][y] === player) numConnected++;
				else numConnected = 0;
				if (numConnected === numWin) return player;
			}
		}
		numConnected = 0;
		for (x = 0; x < size; x++) {
			if (grid[x][x] === player) numConnected++;
			else numConnected = 0;
			if (numConnected === numWin) return player;
		}
		numConnected = 0;
		for (x = size - 1, y = 0; x >= 0; x--, y++) {
			if (grid[x][y] === player) numConnected++;
			else numConnected = 0;
			if (numConnected === numWin) return player;
		}
		if (numZero === 0 && $scope.data.gameActive) {
			return -2;
		} else {
			return -1;
		}
	}
};