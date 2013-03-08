(function($) {
    $.fn.minesweeper = function(options) {
    
        // build main options before element iteration
        var opts = $.extend({}, $.fn.minesweeper.defaults, options);
    
        return this.each(function() {
            $this = $(this);
        
            // build element specific options
            var o = $.meta ? $.extend({}, opts, $this.data()) : opts;
            
            var Minesweeper = function() {};
            Minesweeper.prototype = $.fn.minesweeper.gameEngine;

            var MinesweeperView = function() {};
            MinesweeperView.prototype = $.fn.minesweeper.view;
            
            var ms = new Minesweeper(),
                msView = new MinesweeperView();

            msView.init($this, o.mineCount, o.rowCount, o.columnCount, o.theme);
            ms.init(o.mineCount, o.rowCount, o.columnCount, msView);

            msView.events.on('ms.gameStart', function(e, config) {
                // todo: tear down existing instances and create new ones
                console.log('ms.gameStart');
            });

            ms.run();
        });
    };
    
    // plugin defaults
    $.fn.minesweeper.defaults = {
        mineCount: 40,
        rowCount: 20,
        columnCount: 20,
        theme: 'snazzy'
    };

    // Creates the game controlls and UI
    $.fn.minesweeper.view = {

        init: function($container, mineCount, rowCount, columnCount, themeClass) {
            this.el = {};
            this.el.container = $container;

            // Create an empty jQuery object
            // for triggering custom events
            this.events = $({});

            this.mineCount = mineCount;
            this.rowCount = rowCount;
            this.columnCount = columnCount;
            this.themeClass = themeClass;
        },

        getElements: function() {
            this.el.btnConfig = $('<a data-js="modal" id="ms_info" href="#" rel="#ms_config">info</a>');
            
            // Config menu
            this.el.config = $(this.html.getConfigMenu()).hide();
            this.el.levelSelect = this.el.config.find('#ms_level_select');
            this.el.inputRows = this.el.config.find('#ms_rows');
            this.el.inputColumns = this.el.config.find('#ms_columns');
            this.el.inputMines = this.el.config.find('#ms_mines');
            this.el.btnStart = this.el.config.find('#ms_btn_start');
            this.el.btnCancel = this.el.config.find('#ms_btn_cancel');

            // fragments
            this.el.statusBar = $('<div id="ms_status" class="ms_status"></div>');
            this.el.timer = $('<div class="ms_timer">0</div>');
            this.el.gameContainer = $('<div class="ms_container"></div>');
        },
        
        enableEvents: function() {
            
            var self = this;
            
            if ($.fn.overlay) {
                this.el.btnConfig.overlay();
            }
            
            // Change the game inputs to match the
            // settings of the selected level
            this.el.levelSelect.change(function() {
                self.setInputs($(this).val());
            });
            
            // Get the current level settings and
            // trigger the gameStart event
            this.el.btnStart.click(function(e) {
                var config = {
                    rowCount: self.el.inputRows.val(),
                    columnCount: self.el.inputColumns.val(),
                    mineCount: self.el.inputMines.val()
                };
                
                // close modal
                self.el.btnConfig.overlay().close();

                self.events.trigger('ms.gameStart', config);
                
                return false;
            });
            
            this.el.btnCancel.click(function(e) {
                // close modal
                self.el.btnConfig.overlay().close();
                return false;
            });

            // Delegate cell clicks to the parent table
            // Trigger the custom event for revealing the cell
            this.el.msTable.on('click', 'td', function(e) {
                self.events.trigger('ms.cellClick', this);
            });

            // Disable right-click context menu on the table
            if ($.fn.noContext) {
                this.el.msTable.noContext();
            }

            // Set right-click behavior
            if ($.fn.rightClick) {
                this.$msTable.rightClick(function(e) {
                    self.events.trigger('ms.cellRightClick', $(e.target));
                });
            }

            this.events.on('ms.gameEnd', function(e) {
                // remove all click events
                self.el.msTable.off('click', 'td');

                self.revealMistakes();

                // disable rollover states
                self.el.msTable.find('.blank').removeClass('blank');
            });
        },
        
        html: {
            // Returns the table html populated with rows and columns
            getTable: function(rowCount, columnCount, themeClass) {
                var msTable = '<table class="ms_table ' + themeClass + '">';

                for (var row=0; row < rowCount; row++) {
                    msTable += '<tr>';
                    for (var col=0; col < columnCount; col++) {
                        msTable += '<td id="'+ row +'-'+ col +'" class="blank"></td>';
                    }
                    msTable += '</tr>';
                }
                msTable += '</table>';

                return msTable;
            },
            
            getMineCounter: function(mineCount) {
                return '<div class="ms_counter">' + mineCount + '</div>';
            },

            getConfigMenu: function() {
                return '<div id="ms_config" class="modal"><form><div><p><label for="ms_rows">Rows</label><br><input type="text" name="ms_rows" id="ms_rows"></p><p><label for="ms_columns">Columns</label><br><input type="text" name="ms_columns" id="ms_columns"></p><p><label for="ms_mines">Mines</label><br><input type="text" name="ms_mines" id="ms_mines"></p></div><div><label for="ms_level_select">Level</label><br><select id="ms_level_select"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option><option value="custom">Custom</option></select></div><button id="ms_btn_cancel">Cancel</button><button id="ms_btn_start">Start Game</button></form></div>';
            }
        },
        
        render: function() {
            this.getElements();
            
            this.el.counter = $(this.html.getMineCounter(this.mineCount));
            
            this.el.statusBar
                .append(this.el.timer)
                .append(this.el.counter)
                .append(this.el.btnConfig.clone(true))
                ;

            this.el.msTable = $(this.html.getTable(this.rowCount, this.columnCount, this.themeClass));
            
            this.el.gameContainer
                .append(this.el.msTable)
                .append(this.el.statusBar)
                .append(this.el.config)
                ;
            
            // this.el.container.html(this.el.gameContainer.clone(true)); // not sure why we were trying to clone it
            this.el.container.html(this.el.gameContainer);
        },
        
        // Sets form input values
        setInputs: function(level) {
            this.el.inputRows.val(level.rowCount);
            this.el.inputColumns.val(level.columnCount);
            this.el.inputMines.val(level.mineCount);
        },

        revealMistakes: function() {
            this.el.msTable.find('.flag').each(function(i, cell) {
                $(cell).removeClass('flag').addClass('notMine');
            });
        }
    };
    
    // Expose the game engine for unit testing
    $.fn.minesweeper.gameEngine = {
        levels: {
            easy: {
                columnCount: 20,
                rowCount: 20,
                mineCount: 40
            },
            medium: {
                columnCount: 40,
                rowCount: 20,
                mineCount: 80
            },
            hard: {
                columnCount: 80,
                rowCount: 20,
                mineCount: 150
            }
        },
        
        init: function(mineCount, rowCount, columnCount, view) {

            // create state properties
            this.mineLocations = this.distributeMines(mineCount, rowCount, columnCount);
            this.rowCount = rowCount;
            this.columnCount = columnCount;

            this.view = view;

            this.mineCount = mineCount;
            this.seconds = 0;
            this.userMineCount = mineCount; // The mines the user has marked
            
            // create a virtual game grid and pre-populate mine counts & locations
            this.gameGrid = this.populateGrid(this.createGrid(this.mineLocations, rowCount, columnCount), this.mineLocations);
        },
        
        
        // Starts the game
        run: function() {
            
            this.startTimer();

            this.view.levels = this.levels;
            this.view.render();

            this.view.setInputs(this.levels.easy);
            this.view.enableEvents();

            this.doEventBinding();
        },
        

        doEventBinding: function() {
            var self = this;

            this.view.events.on('ms.cellClick', function(e, cell) {
                self.revealCell($(cell));
            });

            this.view.events.on('ms.cellRightClick', function(e) {
                self.rightClick($(e.target));
            });
        },


        firstClick: function($cell) {
            // TODO first click can't be a mine,
            // recalculate grid if $cell is a mine
            
            var self = this;

            this.$msTable.unbind();
            this.$msTable.click(function(e) {
                self.revealCell($(e.target));
            });
        },


        rightClick: function($cell) {
            var cellID = $cell.attr('id'),
                clickStates = Array('flag','question','blank'),
                hasState = false;

            for (var i = clickStates.length - 1; i >= 0; i--){
                if ($cell.hasClass(clickStates[i])) {
                    hasState = true;
                    break;
                }
            }

            if ($cell.hasClass('lock') && (!hasState)) { // Disable right click on locked cells
                return;
            } else {
                while (!$cell.hasClass(clickStates[0])) {
                    clickStates.push(clickStates.shift()); // cycle through list
                }

                $cell.removeClass(clickStates[0]).addClass(clickStates[1]);

                switch(clickStates[1]) {
                    case 'blank':
                        //unlock cell
                        $cell.removeClass('lock');
                        break;
                    case 'flag':
                        this.updateMineCountDisplay(1);
                        break;
                    case 'question':
                        this.updateMineCountDisplay(-1);
                        break;
                }

            }
        },
        
        
        updateMineCountDisplay: function(decrement) {
            this.userMineCount -= decrement;
            this.$counter.html(this.userMineCount);
        },
        

        startTimer: function() {
            var self = this;
            this.timer = setInterval(function() {
                self.seconds++;
                self.view.el.timer.html(self.seconds);
            }, 1000);
        },


        // Show all the mines by adding the 'mineSplode' class
        // @TODO: move this to view
        revealMines: function(mines) {
            var mineIDs = this.getMineIDs(mines);
            $.each(mineIDs, function(count, mine) {
                $('#'+mine).removeClass('flag blank').addClass('mineSplode');
            });
        },


        endGame: function(status) {
            if(status) {
                // end the game in a good way
                this.view.events.trigger('ms.gameWon');
            } else {
                // mine has been clicked
                this.view.events.trigger('ms.gameEnd');

                this.revealMines(this.mineLocations);

                // stop timer
                if (this.timer) { clearInterval(this.timer); }
            }
        },
        
        // Grid Functions
            
        // Returns a multi-dimensional array of the game grid
        // with the mines in place with the value of '*'
        createGrid: function(mines, rowCount, columnCount) {
            var grid = Array(rowCount);

            for (var row = rowCount - 1; row >= 0; row--) {
                grid[row] = Array(columnCount);
                for (var col = columnCount - 1; col >= 0; col--) {
                    if (mines[row] && $.inArray(col, mines[row]) > -1) {
                        grid[row][col] = '*'; //add mines to grid cells
                    }
                }
            }
            
            return grid;
        },

        
        // Adds the surrounding mine count to each cell
        populateGrid: function(grid, mines) {
            for (var row = grid.length - 1; row >= 0; row--) {
                for (var col = grid[row].length - 1; col >= 0; col--) {
                    var cell = grid[row][col];
                    if (cell != '*') { // cell doesn't contain mine
                        grid[row][col] = this.getSurroundingMineCount(row, col, mines);
                    }
                }
            }

            return grid;
        },
        
        
        getRandom: function(limit) {
            return Math.floor((limit) * Math.random()) + 1;
        },
        
        
        // Creates a multidimensional array representing the minefield.
        // Randomly places the mines.
        distributeMines: function(mineCount, rowCount, columnCount) {

            var mineLocations = {};

            for (var j = mineCount - 1; j >= 0; j--) {
                var row = this.getRandom(rowCount),
                    col = this.getRandom(columnCount);
                
                if (mineLocations[row] === undefined) {
                    mineLocations[row] = Array();
                }
                
                // prevent duplicates by generating new coordinates until
                // column is not not found in mineLocations[row] array
                while ($.inArray(col, mineLocations[row]) > -1) {
                    //row = this.getRandom(rowCount);
                    col = this.getRandom(columnCount);
                }
                
                mineLocations[row].push(col);
            }
            
            return mineLocations;
        },


        // Returns an array of string coordinates of mine positions
        getMineIDs: function(mines) {
            if (this.getMineIDs.cache) {
                return this.getMineIDs.cache;
            }
            var cache = Array();

            for (var row in mines) {
                for (var col = mines[row].length - 1; col >= 0; col--) {
                    cache.push(this.getCellId(row, mines[row][col]));
                }
            }
            
            return cache;
        },
        
        // Cell Functions
            
        // Returns a string combination of a given row and column
        getCellId: function(row, col) {
            return (row.toString() + '-' + col.toString());
        },
        

        // Calculates the coordinates of a cell's surrounding cells
        getSurroundingCells: function(targetRow, targetCol) {
            
            var surroundingCells = Array(),
                surroundingCellDims = Array(
                    [-1,1],
                    [0,1],
                    [1,1],
                    [1,0],
                    [1,-1],
                    [0,-1],
                    [-1,-1],
                    [-1,0]
                );

            for (var c = surroundingCellDims.length - 1; c >= 0; c--) {
                var row = targetRow + surroundingCellDims[c][0],
                    col = targetCol + surroundingCellDims[c][1];

                // check that cell exists -- its coordinates are not out of bounds
                if (row >= 0 && col >= 0 && row < this.rowCount && col < this.columnCount) {
                    surroundingCells.push([row, col]);
                }
            }
            
            return surroundingCells;
        },


        getAdjacentCells: function(targetRow, targetCol) {
            var surroundingCells = this.getSurroundingCells(targetRow, targetCol);

            var adjacentCells = $.map(surroundingCells, function(cell) {
                var row = cell[0],
                    col = cell[1];

                // remove diagonal cells
                if(!(row == targetRow+1 || row == targetRow-1) && !(col == targetCol+1 || col == targetCol-1)) {
                    return cell;
                }
            });

            return adjacentCells;
        },


        // Gets a cell's surrounding cells,
        // counts the ones that contain mines
        getSurroundingMineCount: function(targetRow, targetCol, mines) {
            var mineCount = 0,
                surroundingCells = this.getSurroundingCells(targetRow, targetCol);

            for (var j = surroundingCells.length - 1; j >= 0; j--) {
                var cell = surroundingCells[j],
                    mineRowArray = Array();
                    
                if (mines[cell[0]]) {
                    mineRowArray = mines[cell[0]];
                }

                if ($.inArray(cell[1], mineRowArray) > -1) {
                    mineCount++;
                }
            }

            return mineCount;
        },
        
        
        // Ads the appropriate css class to the cell
        // in order to show its state
        formatCell: function($cell, cellContents) {
            var klass='';
            
            switch(cellContents) {
                case true:
                    klass = 'mineSplode';
                    break;
                case 0:
                    klass = 'empty';
                    break;
                default:
                    klass = 'near'+cellContents.toString();
            }

            $cell.removeClass('blank').addClass(klass);
        },
        
        
        revealCell: function($cell, grid, parentRow, parentCol) {
            var cellId = $cell.attr('id');
            
            if ($cell.hasClass('lock')) {
                return; // Don't reveal cell if it's already revealed
            } else {
                var cellDims = cellId.split('-'),
                    row = parseInt(cellDims[0], 10),
                    col = parseInt(cellDims[1], 10);

                if (!grid) { // grid is passed back on recursive calls so we don't have to look it up again
                    console.log('getting grid');
                    grid = this.gameGrid;
                }

                var cellContents = grid[row][col];

                // TODO: find out why cellContents is not a string sometimes

                if (cellContents === undefined) {
                    console.log('cellContents is undefined');
                    console.log(grid[row]);

                    return;
                }
                
                // lock this cell to dissable further interaction
                $cell.addClass('lock');

                // cell contains a mine
                if (cellContents == '*') {
                    this.endGame(false);
                }
                // cell is empty
                else if (cellContents === 0) {
                    // parentRow will be null on first run
                    if (parentRow === undefined || $.inArray([row, col], this.getAdjacentCells(parentRow, parentCol))) {
                        this.revealSurroundingCells(grid, row, col);
                    }
                }

                this.formatCell($cell, cellContents);
            }
        },
        
        
        revealSurroundingCells: function(grid, targetRow, targetCol) {
            var surroundingCells = this.getSurroundingCells(targetRow, targetCol),
                length = surroundingCells.length;
            
            for (var c = length - 1; c >= 0; c--) {
                var row = surroundingCells[c][0],
                    col = surroundingCells[c][1],
                    id = this.getCellId(row, col);
                
                this.revealCell($('#'+id), grid, targetRow, targetCol);
            }
        }
    };
    
})(jQuery);