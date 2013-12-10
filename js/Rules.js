var Rules = [];

Rules.checkGameOver = function(grid){
    // All possible winning combination patterns.
    var patterns = [
        [[0, 2], [0, 1], [0, 0]], // Left.
        [[0, 0], [1, 0], [2, 0]], // Top.
        [[2, 0], [2, 1], [2, 2]], // Right.
        [[2, 2], [1, 2], [0, 2]], // Bottom.
        [[0, 1], [1, 1], [2, 1]], // Horizontal middle.
        [[1, 0], [1, 1], [1, 2]], // Vertical middle.
        [[0, 0], [1, 1], [2, 2]], // Top-left to bottom-right.
        [[0, 2], [1, 1], [2, 0]]  // Bottom-left to top-right.
    ];

    for (var i = 0, len = patterns.length; i < len; i++){
        var accumulative = '';

        for (var j = 0, len2 = patterns[i].length; j < len2; j++){
            var point = patterns[i][j];
            accumulative += grid[point[1]][point[0]];
        }

        if (accumulative === '000' || accumulative === '111')
            return {'draw': false, 'winner': accumulative[0], 'pattern': patterns[i]};
    }

    for (var y = 0, len = grid.length; y < len; y++){
        for (var x = 0, len2 = grid[y].length; x < len2; x++)
        {
            if (grid[y][x] === -1) // Cell empty?
                return null; // No draw yet, a move can still be made.
        }
    }

    return {'draw': true};
};
