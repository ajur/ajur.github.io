;(function(){
    var mapper = window.MAPPER = {};
    
    var default_spec_data = [
        -3, 5, 0, -3, 5, 0, -3, 5, 0, 
        11, 0, 11, 0, 5, -1, 5, 0, 11, 0, 11, 0,
        -3, 5, 0, -3, 5, 0, -3, 5, 0];
    
    mapper.spec = {};
    
    var cvs, ctx, img_out;
    var selecting = null;
    
    var init = mapper.init = function(output){
        var out = document.getElementById(output);
        
        cvs = document.createElement('canvas');
        cvs.height = 200;
        cvs.width = 200;
        // cvs.style.background = '#eeeeee';
        cvs.onselectstart = function(){ return false; };
        out.appendChild(cvs);
        
        img_out = document.createElement('div');
        img_out.innerHTML = '<img/>';
        img_out.style.float = 'left';
//        out.appendChild(img_out);
        
        ctx = cvs.getContext('2d');
        
        mapper.spec = explode(default_spec_data);
        render(mapper.spec);
        
        cvs.addEventListener('mousedown', function(evt){
            evt.stopPropagation();
            cur_pos = getCursorPosition(cvs, evt);
            pos_cell = getPositionCell(cur_pos);
            
            if(pos_cell){
                selecting = !mapper.spec.cells[pos_cell.row][pos_cell.col];
                mapper.spec.cells[pos_cell.row][pos_cell.col] = selecting;
                render(mapper.spec, pos_cell);
            }
        });
        cvs.addEventListener('mouseup', function(evt){
            selecting = null;
        });
        cvs.addEventListener('mousemove', function(evt){
            evt.stopPropagation();
            cur_pos = getCursorPosition(cvs, evt);
            pos_cell = getPositionCell(cur_pos);
            
            if(selecting != null && pos_cell && mapper.spec.cells[pos_cell.row][pos_cell.col] != selecting){
                mapper.spec.cells[pos_cell.row][pos_cell.col] = selecting;
                render(mapper.spec, pos_cell);
            }
        });
    };
    
    var canvas_mouse_actions = function(evt){
        evt.stopPropagation();
        cur_pos = getCursorPosition(cvs, evt);
        pos_cell = getPositionCell(cur_pos);
        
        var changed = canvas_event(evt, cur_pos);
        if(changed){
            render(mapper.spec);
        }
    };
    
    var explode = function(data){
        var cells = []
        var cur_row = 0;
        var cur_row_len = 0;
        var max_row_len = 0;
        for(var i=0; i<data.length; ++i){
            if(data[i] == 0){
                if(cur_row_len > max_row_len){
                    max_row_len = cur_row_len;
                }
                cur_row_len = 0;
                ++cur_row;
            }else{
                if(cur_row_len==0){
                    cells.push([]);
                }
                cur_row_len += Math.abs(data[i]);
                for(var k=Math.abs(data[i]); k>0; --k){
                    cells[cur_row].push(data[i]>0);
                }
            }
        }
        console.log(cells.forEach(function(row){ return row.length; }))
        return {
            data: data,
            rows: cells.length,
            cols: max_row_len,
            cells: cells
        };
    };
    
    var implode = function(spec){
        var data = [];
        //TODO
    };
  
    var render = function(spec, cell){
        if(cell != null){
            render_cell(spec, cell);
        }else{
            render_canvas(spec);
        }
        render_img();
    };
    
    var render_canvas = function(spec){
        var w = cvs.width,
            h = cvs.height,
            cw = cvs.width / spec.cols,
            ch = cvs.height / spec.rows,
            cd = Math.floor(Math.min(cw, ch));
        
        ctx.clearRect(0, 0, w, h);
        for(row=0; row<spec.rows; ++row){
            for(col=0; col<spec.cols; ++col){
                ctx.fillStyle = spec.cells[row][col] ? '#00aaff' : '#eeeeee';
                ctx.fillRect(col*cd+2, row*cd+2, cd-4, cd-4);
            }
        }
    };
    
    var render_cell = function(spec, cell){
        var w = cvs.width,
            h = cvs.height,
            cw = cvs.width / spec.cols,
            ch = cvs.height / spec.rows,
            cd = Math.floor(Math.min(cw, ch)),
            cx = cell.col * cd,
            cy = cell.row * cd;
        ctx.clearRect(cx, cy, cd, cd);
        ctx.fillStyle = spec.cells[cell.row][cell.col] ? '#00aaff' : '#eeeeee';
        ctx.fillRect(cx+2, cy+2, cd-4, cd-4);
    };
    
    var render_img = function(){
        var data = cvs.toDataURL()
        var img = document.createElement('img');
        img.src = data;
        img_out.replaceChild(img, img_out.lastChild);
    };
    
    var getCursorPosition = function(canvas, event) {
        var rect = canvas.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;
        return {x:x, y:y};
    };
    
    var getPositionCell = function(cur){
        var w = cvs.width,
            h = cvs.height,
            cw = cvs.width / mapper.spec.cols,
            ch = cvs.height / mapper.spec.rows,
            cd = Math.floor(Math.min(cw, ch)),
            cur_row = Math.floor(cur.y / cd),
            cur_col = Math.floor(cur.x / cd);
        if(cur_row >= 0 && cur_row < mapper.spec.rows
           && cur_col >= 0 && cur_col < mapper.spec.cols){
            return {row: cur_row, col: cur_col};
        }
        return null;
    };
    
}());