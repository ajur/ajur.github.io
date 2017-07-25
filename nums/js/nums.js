
//Utility functions
(function(window, undefined){

    /** Checks condition and throws error if it is false 
     *  If assert.debug is true, than attepmts to log a massage and stacktrace in console
     */
    var assert = function(condition, message, error_type) {
        if(!condition){
            var err = {
                name : (error_type !== undefined ? error_type.toString() : "AssertError"),
                message : message
            };
            err.toString = function(){
                return this.name + ": " + this.message;
            };
            if(assert.debug){
                try {
                    console.log("Assertion failed: "+err.toString());
                    console.trace();
                }catch(e){}
            }
            throw err;
        }
    };
    assert.debug = true;

    
    /** merges all own properties of src into dest */
    var object_merge = function(dest, src){
        var attr;
        for(attr in src){
            if(src.hasOwnProperty(attr)){
                dest[attr] = src[attr];
            }
        }
    };
    
    /** updates all properties of dest that are defined in src */
    var object_update = function(dest, src){
        var attr;
        for(attr in src){
            if(dest.hasOwnProperty(attr)){
                dest[attr] = src[attr];
            }
        }
    };
    
    var trim = function(str){
        if(str.trim){
            return str.trim();
        }else{
            return str.replace(/(^\s*)|(\s*$)/g, "");
        }
    };
    
    var utils = {
        object_merge : object_merge,
        object_update : object_update,
        trim : trim
    };
    
    //set global objects
    window.assert = assert;
    window.UTILS = utils;
}(window));


/** NUMS module constructing */
(function(window, undefined){
    
    /** Fame initial options map */
    var options = {
        player1_name : 'Player 1',      // First player name
        player1_human : true,           // Is first player is a human or AI
        player1_ai : 'naive',           // AI algorithm (if player1_human is false)
        player2_name : 'Player 2',      // Second player name
        player2_human : true,           // If second player is a human or AI
        player2_ai : 'naive',           // AI algorithm (if player2_human is false)
        
        start_player : 1,               // Starting player (1 or 2)
        start_horizontal : null,        // If starting move is horizontal?
        
        board_map : null,               // Custom board map definition (see ff_string_map), or null (see ff_fill)
        board_map_cols : 10,            // Colums number (if board_map is null)
        board_map_rows : 10,            // Rows number (if board_map is null)
        
        board_fill : 'uniform',         // Random distribution used for cell value generation
        board_fill_min : -25,           // Minimal generated value
        board_fill_max : 40,            // Maximal generated value
        board_fill_nils : false,        // Accept nil (0) values 
        
        drawer : 'html',                // Drawing function
        drawer_div : 'nums'             // Drawing target div ID
    };//obj options
    
    
    /* ************************************************************ */
    /* DRAWING                                                      */
    /* ************************************************************ */
    
    var drawers = {};
    
    var add_drawer = function(name, drawer){
        assert(typeof name === 'string' && typeof drawer === "function", "Drawer must be a function");
        drawers[name] = drawer;
    };
    
    var init_drawer = function(){
        if(options.drawer === null || !drawers.hasOwnProperty(options.drawer)){
            return {
                on_init : function(gamestate){},
                on_start : function(){},
                on_move : function(col, row){},
                on_undo : function(cell){},
                on_end : function(){}
            };
        }
        var _drawer = drawers[options.drawer];
        return _drawer(options.drawer_div);
    };
    
    var drawer = null;
    
    /** make jQuery drawer */
    var html_jquery_drawer = function(targetid){
        var _game, target, $ = function(){
            throw new ReferenceError("jQuery is not defined; html_drawer needs jQuery to work properly");
        };
        
        var make_cell_id = function(col, row, hash){
            return [hash?'#':'','nums-cell-',col,'-',row].join('');
        };
        
        var draw_score = function(){
            var i, panel = $("<div id='nums-score'>");
            for(i=0; i<_game.players.length; ++i){
                htmlstr = ["<div id='nums-score-player", i+1, "'><strong>", _game.players[i].name, ': <span>', _game.players[i].score].join('');
                panel.append($(htmlstr));
            }
            target.append(panel);
        };
        
        var update_score = function(){
            target.find("#nums-score").find('div').removeClass('active').end()
                  .find("#nums-score-player1 span").text(_game.players[0].score).end()
                  .find("#nums-score-player2 span").text(_game.players[1].score).end()
                  .find("#nums-score-player"+(_game.players.current_index+1)).addClass('active');
        };
        
        var update_board = function(){
            target.find("td.allowed").removeClass('allowed');
            $(_game.move.allowed).each( function(){
                $(make_cell_id(this.col,this.row,true)).addClass('allowed');
            });
            target.find("td.last").removeClass('last');
            if(_game.move.history.length>0){
                $(make_cell_id(_game.move.col, _game.move.row, true)).addClass('last');
            }
        };
        
        var draw_board = function(){
            var table = $("<table id='nums-board'>");
            var col, row, rows=_game.board.rows, cols=_game.board.cols, cells=_game.board.cells;
            for(row=0; row<rows; ++row){
                var tr = $("<tr>");
                for(col=0; col<cols; ++col){
                    var td = $("<td>")
                    var cell = cells[row][col]
                    td.attr('id', make_cell_id(col,row,false));
                    if(cell !== null){
                        td.text(cell.value);
                        if(cell.value < 0){
                            td.addClass('negative');
                        }
                        (function(col,row){
                            td.click(function(evt){
                                if(_game.state === _game.WAITING && $(this).hasClass('allowed')){
                                    _game.make_move(col,row);
                                }
                            });
                        }(col,row));
                    }
                    tr.append(td);
                }
                table.append(tr);
            }
            target.append(table);
        }
        
        var on_init = function(gamestate){
            if(window.jQuery !== undefined){
                $ = window.jQuery;
            }
            target = $('div#'+targetid);
            assert(target.length===1, "There is no div element with id="+targetid);
            assert(gamestate!==null, "NUMS is not initialized!");
            _game = gamestate;
            
            target.empty();
            
            draw_score();
            draw_board();
        };
        
        var on_start = function(){
            update_score();
            update_board();
        };
        
        var on_move = function(col, row){
            $(make_cell_id(col,row,true)).addClass('inactive');
            update_score();
            update_board();
        };
        
        var on_undo = function(cell){
            $(make_cell_id(cell.col, cell.row, true)).removeClass('inactive');
            $("#nums-score-summary").remove();
            update_score();
            update_board();
        };
        
        var on_end = function(){
            var winner = _game.players.winner();
            var winner_adventage = winner.score - _game.players[(1-_game.players.winner_index())].score;
            str = ['<div id="nums-score-summary"><h2><span>', winner.name, 
                    '</span> wins! Scoring <span>', winner.score, 
                    '</span> points, with adventage of <span>', winner_adventage,
                    '</span> points.</h2></div>'].join(''); 
            target.find("#nums-score").after(str);
        };
        
        return {
            on_init : on_init,
            on_start : on_start,
            on_move : on_move,
            on_undo : on_undo,
            on_end : on_end
        };
    };
    add_drawer('html-jquery', html_jquery_drawer);
    add_drawer('html', html_jquery_drawer);
    
    /* ************************************************************ */
    /* UTILITY FUNCTIONS                                            */
    /* ************************************************************ */
    
    /** contains random distributions function */
    var random = {
        /** Function returns randomizer with uniform distribution.
          * Returned function gives integer numbers from range [min,max) 
          */
        uniform : function(min, max){
            var min = Math.floor(min),
                max = Math.floor(max),
                range = max-min;
            return function(){
                return (min + Math.floor(Math.random()*range));
            };
        },
        
        /** Wraps randomizer to ensure it won't return '0' */
        nonils : function(rand_func){
            return function(col, row){
                var val;
                do {
                    val = rand_func(col, row);
                } while(val === 0);
                return val;
            };
        },
        
        /** returns randomizer by name */
        named : function(name, min, max){
            assert(typeof name==="string" && name!=="nonils" && name!=="named", "'"+name+"' is not a randomizer constructor name");
            return this[name](min,max);
        }
    };//obj random
    
    var make_cell = function(col, row, value){
        return {
            col : col,
            row : row,
            value : value,
            active : true
        };//obj cell
    };
    
    /** Filling Function returning fully filled rectangular board  of given size */
    var ff_full = function(cols, rows, rand_func){
        assert(typeof rand_func === "function", "rand_func has to be a function");
        var col, row, _cells = [];
        for(row=0; row<rows; ++row){
            _cells[row] = [];
            for(col=0; col<cols; ++col){
                _cells[row][col] = make_cell(col, row, rand_func(col, row));
            }
        }
        return _cells;
    };
    
    var ff_mapper = function(spec, rand_func){
        var map = {
            cols : spec.cols,
            rows : spec.rows,
            cells : []
        };
        
        var col, row;
        for(row=0; row<spec.rows; ++row){
            map.cells[row] = [];
            for(col=0; col<spec.cols; ++col){
                if(spec.cells[row][col]){
                    map.cells[row][col] = make_cell(col, row, rand_func(col, row));
                }else{
                    map.cells[row][col] = null;
                }
            }
        }
        
        return map;
    };
    
    /** Filling functions returning custom board based on given String
      * map_str format: TODO
      */
    var ff_string_map = function(map_str, rand_func){
        var lines = map_str
                .replace(/[\t _',]/g,'.')                    // unify blanks
                .replace(/[@$%;]/g,'#')                      // unify blocks
                .replace(/(^(\.*\n)*)|((\n\.*)*$)/g,'')      // get rid of empty lines at begining and end
                .split(/\n/);                                // split by new lines
        var matches = lines.map(function(elem){
            return elem.match(/^(\.*)([\.#]*?)(\.*)$/);      // match prefix blanks, blocks, ending blanks
        });
        var blanks_lengths = matches.map(function(elem){
            return elem[1].length; 
        });
        var max_prefix = Math.max.apply(null, blanks_lengths);  // get maximum prefix length
        blanks_lengths = matches.map(function(elem){
            return (elem[2].length === 0 ? max_prefix : elem[1].length); // if line is empty, assume max prefix
        });
        var min_prefix = Math.min.apply(null, blanks_lengths); // get minimal prefix
        lines = matches.map(function(elem){
            return elem[1].slice(min_prefix).concat(elem[2]);  // cleaned lines
        });
        var lengths = lines.map(function(elem){ 
            return elem.length;
        });
        var max_cols = Math.max.apply(null, lengths);  // get maximum columns number
        
        var map = {
            cols : max_cols,
            rows : lines.length,
            cells : []
        };
        
        var col, row;
        for(row=0; row<map.rows; ++row){
            map.cells[row] = [];
            for(col=0; col<map.cols; ++col){
                if(lines[row][col]!==undefined && lines[row][col]==='#'){
                    map.cells[row][col] = make_cell(col, row, rand_func(col, row));
                }else{
                    map.cells[row][col] = null;
                }
            }
        }
        
        return map;
    };
    
    var end_event_listeners = [];
    
    var add_end_event_listener = function(listener){
        assert(typeof listener === 'function', "End Event listener must be a function");
        end_event_listeners.push(listener);
    };
    
    var trigger_end_event = function(gamestate){
        var i;
        for(i=0; i<end_event_listeners.length; ++i){
            end_event_listeners[i](gamestate.players.winner());
        }
    };
    
    /* ************************************************************ */
    /* AI ALGORITHMS                                                */
    /* ************************************************************ */

    var ai_algorithms = {
        naive : function(gamestate){
            var allowed = gamestate.move.allowed;
            assert(allowed.length>0, "There is no allowed moves for AI player!");
            var i, max = allowed[0];
            for(i=1; i<allowed.length; ++i){
                if(allowed[i].value > max.value){
                    max = allowed[i];
                }
            }
            return max;
        },
        thinker : function(gamestate){
            var allowed = gamestate.move.allowed;
            assert(allowed.length>0, "There is no allowed moves for AI player!");
            var i, max, moves = [];
            for(i=0; i<allowed.length; ++i){
                moves[i] = allowed[i].value;
                gamestate.try_move(allowed[i].col, allowed[i].row, true);
                if(gamestate.move.allowed.length>0){
                    max = ai_algorithms.naive(gamestate);
                    moves[i] -= max.value;
                }else{
                    max = (options.board_fill_max - options.board_fill_min) * 2;
                    if(gamestate.players.winner_index() === this.index){
                        moves[i] += max;
                    }else{
                        moves[i] -= max;
                    }
                }
                gamestate.undo_move(false, true);
                
            }
            max = { val: moves[0], cell: allowed[0] };
            for(i=1; i<moves.length; ++i){
                if(moves[i] > max.val){
                    max.val = moves[i];
                    max.cell = allowed[i];
                }
            }
            return max.cell;
        },
        resolve : function(name){
            assert(typeof name==="string" && name!=="resolve", "'"+name+"' is not an AI algorithm");
            return this[name];
        }
    };//obj ai_algorithms
    
    /* ************************************************************ */
    /* GAME OBJECTS INITIALIZERS                                    */
    /* ************************************************************ */
    
    /** Initialize two players from options */
    var init_players = function(){
        //TODO asserts on player options
        var _players = [ 
            {
                index: 0,
                name: options.player1_name, 
                human: options.player1_human, 
                ai: ai_algorithms.resolve(options.player1_ai), 
                score: 0 
            }, { 
                index: 1,
                name: options.player2_name, 
                human: options.player2_human, 
                ai: ai_algorithms.resolve(options.player2_ai), 
                score: 0
            }
        ];
        _players.current_index = (options.start_player-1);
        _players.current = function(){ 
            return this[this.current_index]; 
        };
        _players.swap = function(){ 
            this.current_index = 1 - this.current_index;
            return this;
        };
        _players.winner_index = function(){
            if(this[0].score > this[1].score){
                return 0;
            }else if(this[1].score > this[0].score){
                return 1;
            }else{
                return null; //draw
            }
        };
        _players.winner = function(){
            var idx = this.winner_index();
            return (idx!=null ? this[idx] : null);
        };
        return _players;
    };
    
    /** Initialize board based on options */
    var init_board = function(){
        //TODO asserts on board and fill options
        var _board = { 
            cols: 1, 
            rows: 1, 
            cells: [[1]],
            get : function(col, row){ return this.cells[row][col]; },
            set : function(col, row, val){ this.cells[row][col] = val; }
        };//obj _board
        
        var rand_func = random.named(options.board_fill, options.board_fill_min, options.board_fill_max);
        if(!options.board_fill_nils){
            rand_func = random.nonils(rand_func);
        }
        
        if(options.board_map == null){
            _board.cols = options.board_map_cols;
            _board.rows = options.board_map_rows;
            _board.cells = ff_full(_board.cols, _board.rows, rand_func);
        }else if(typeof options.board_map == 'string'){
            var map = ff_string_map(options.board_map, rand_func);
            UTILS.object_update(_board, map);
        }else if(options.board_map.hasOwnProperty('cells')){
            var map = ff_mapper(options.board_map, rand_func);
            UTILS.object_update(_board, map);
        }
        
        return _board;
    };
    
    var init_game = function(){
        var _game = {
            players : init_players(),
            board : init_board(),
            move : {
                col : 0, 
                row : 0,
                horizontal : options.start_horizontal !== null ? options.start_horizontal : (Math.random() < 0.5),
                allowed : [],
                history : []
            },
            state : "initialized",
            
            // 'consts'
            INITIALIZED : "initialized",  // game is initialized
            RUNNING : "running",          // game is running
            ENDED : "ended",              // game has ended
            WAITING : "waiting"           // waiting for player move
        };//obj _game
        
        _game.compute_allowed = function(){
            var i, cell, start, max, get_cell, allowed = [], that=this;
            if(this.move.horizontal){
                start = this.move.col;
                max = this.board.cols;
                get_cell = function(idx){ return that.board.get(idx, that.move.row); };
            }else{
                start = this.move.row;
                max = this.board.rows;
                get_cell = function(idx){ return that.board.get(that.move.col, idx); };
            }
            
            for(i=start; i>=0; --i){
                cell = get_cell(i);
                if(cell === null){ break; }
                if(cell.active){ allowed.push(cell); }
            }
            for(i=start+1; i<max; ++i){
                cell = get_cell(i);
                if(cell === null){ break; }
                if(cell.active){ allowed.push(cell); }
            }
            
            this.move.allowed = allowed;
        };
        
        _game.try_move = function(col, row, nodraw){
            nodraw = nodraw || false;
            var i, cell=null, allowed=this.move.allowed;
            for(i=0; i<allowed.length; ++i){
                if(allowed[i].col === col && allowed[i].row === row){
                    cell = allowed[i];
                    break;
                }
            }
            if(cell === null){
                return false;
            }
            
            this.move.history.push({
                col : this.move.col,
                row : this.move.row,
                cell : cell
            });
            
            cell.active = false;
            
            this.players.current().score += cell.value;
            this.players.swap();
            
            this.move.col = col;
            this.move.row = row;
            this.move.horizontal = !this.move.horizontal;
            
            this.compute_allowed();
            
            if(!nodraw){
                drawer.on_move(col, row);
            }
            
            if(this.move.allowed.length===0){
                this.state = this.ENDED;
                if(!nodraw){
                    drawer.on_end();
                }
            }
            
            return true;
        };
        
        _game.make_move = function(col, row){
            this.state = this.RUNNING;
            var moved, next, player = this.players.current();
            if(col!==undefined && row!==undefined){
                moved = this.try_move(col, row);
                assert(moved || player.human, "AI player is trying to make wrong move on col="+col+" row="+row);
                player = this.players.current();
            }
            while(!player.human && this.state!==this.ENDED){
                next = player.ai(this);
                moved = this.try_move(next.col, next.row);
                assert(moved, "AI player is trying to make wrong move on col="+next.col+" row="+next.row);
                player = this.players.current();
            }
            if(player.human && this.state!==this.ENDED){
                this.state = this.WAITING;
            }
            if(this.state===this.ENDED){
                trigger_end_event(game);
            }
        };
        
        _game.undo_move = function(two_moves, nodraw){
            nodraw = nodraw || false;
            var i, moves_to_undo = two_moves ? 2 : 1;
            var move, hist = this.move.history;
            for(i=0; i<moves_to_undo; ++i){
                if(hist.length > 0){
                    move = this.move.history.pop();
                    
                    move.cell.active = true;
                    
                    this.players.swap();
                    this.players.current().score -= move.cell.value;
                    
                    this.move.col = move.col;
                    this.move.row = move.row;
                    this.move.horizontal = !this.move.horizontal;
                
                    this.compute_allowed();
                    
                    if(!nodraw){
                        drawer.on_undo(move.cell);
                    }
                    this.state = this.RUNNING;
                }
            }
            if(moves_to_undo === 2 && !nodraw){
                this.make_move();
            }
        };
        
        var _col, _row, 
            colrand = random.uniform(0,_game.board.cols),
            rowrand = random.uniform(0,_game.board.rows);
        do {
            _col = colrand();
            _row = rowrand();
        }while(_game.board.get(_col,_row) === null);
        _game.move.col = _col;
        _game.move.row = _row;
        
        return _game;
    };
    
    var game = null;
    
    /* ************************************************************ */
    /* NUMS NAMESPACE                                               */
    /* ************************************************************ */
    
    /** initialize game */
    var init = function(){
        game = init_game();
        drawer = init_drawer();
        drawer.on_init(game);
    };
    
    /** start game */
    var start = function(){
        if(game===null){
            return;
        }
        if(game.state!==game.INITIALIZED){
            init();
        }
        game.compute_allowed();
        
        drawer.on_start();
        
        game.make_move();
    };
    
    /** reset game state, switch starting player and start game again */
    var restart = function(){
        if(game!==null && game.state!==game.INITIALIZED){
            options.start_player = (options.start_player % 2) + 1;
        }
        start();
    };
    
    /** It discards latest two moves (one for each player) */
    var undo = function(){
        game.undo_move(true);
    };
    
    
    /** NUMS function, sets game options from given parameter object */
    var nums = function(opts){
        UTILS.object_update(options, opts);
        init();
        return this;
    };
    nums.start = start;
    nums.restart = restart;
    nums.undo = undo;
    nums.on_end = add_end_event_listener;
    
    //for some hacks
    nums._internal_state = function(){
        return game;
    };
    
    
    /* ************************************************************ */
    /* SETTING GLOBAL VARS                                          */
    /* ************************************************************ */
    window.NUMS = nums;
}(window));

    
