$(function() {  
    var ctx;
    var image;
    var dragging = false;
    var state = 'new'; // new|ready|calculating
    var point = [0, 0];
    var history_index;
    var history;

    function calculate_points() {
        state = 'calculating';
    	var bounds = history[history_index];
        var start_at_run = 1000;
        var height_in_pixels = ctx.canvas.height;
        var width_in_pixels = ctx.canvas.width;
        var scatter_amount = height_in_pixels;
        var init_y = 0.1;
        var max_trys = 500;
        var dx = bounds.width / width_in_pixels;
        var dy = bounds.height / height_in_pixels;
        image = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        var graph = image.data;

        for (var i = 0; i < graph.length; i++)
	    graph[i] = 255;

        for (var x = bounds.left; x < bounds.left + bounds.width; x += dx) {
            var discrete_x = parseInt((x - bounds.left) / dx);

            if (discrete_x < 0)
                discrete_x = 0;
            if (discrete_x >= width_in_pixels)
                discrete_x = width_in_pixels - 1;

            var y = init_y;

            for (var i = 0; i < start_at_run; i++)
                y = chaos_function(x, y);

            if (y < 0)
                continue;

           scatter_chart:
            for (var i = 0; i < scatter_amount; i++) {
                var trys = 0;
                y = chaos_function(x, y);

                while(true) {
                    var discrete_y = parseInt((y - bounds.bottom) / dy);
                    discrete_y = height_in_pixels - 1 - discrete_y;

                    if (discrete_y < height_in_pixels && discrete_y >= 0) {
			var j = 4 * (discrete_x + discrete_y * width_in_pixels);

			for (var pi = 0; pi < 3; pi++) {
			    var v = graph[j + pi];
			    if (v > 0) {
			       v -= 0x11;
			       graph[j + pi] = v < 0 ? 0 : v;
			    }
 		        }
                        break;
                    }
                    y = chaos_function(x, y);

                    if (++trys == max_trys)
                        break scatter_chart;
                }
            }
        }
        ctx.putImageData(image, 0, 0);
        state = 'ready';
    	update_button_state();
    }
    
    function chaos_function(x, y) {
        return x * y * (1.0 - y);
    }

    function draw_box(p1, p2) {
        ctx.putImageData(image, 0, 0);
        ctx.strokeRect(p1[0], p1[1], p2[0] - p1[0], p2[1] - p1[1]);
    }

    function get_point(e) {
        var offset = $('#myCanvas').offset();
        if (e.changedTouches)
	    e = e.changedTouches[0];
       	return [
	    e.pageX - offset.left,
  	    e.pageY - offset.top,
      	];    		      
    }

    function history_add(b) {
	while (history_index < history.length - 1) {
	    history.pop();
	}
        history.push(b);
        history_index = history.length - 1;
        calculate_points();
    }

    function history_next(e) {
	if (history_index < history.length - 1) {
	    history_index++;
	    calculate_points();
	}
    }

    function history_reset(e) {
        history = [];
    	history_add({
            left: 1.0,
            bottom: 0.0,
            width: 3.01,
            height: 1.01,
    	});
    }

    function history_prev(e) {
        if (history_index > 0) {
	    history_index--;
            calculate_points();
        }
    }

    function init() {
        ctx = $('#myCanvas')[0].getContext('2d');
    	ctx.strokeStyle = '#0000FF';
    	ctx.lineWidth = 1;
        document.addEventListener('touchstart', selection_start, false);
    	$(document).mousedown(selection_start);
        document.addEventListener('touchmove', selection_move, false);
    	$(document).mousemove(selection_move);
        document.addEventListener('touchend', selection_end, false);
    	$(document).mouseup(selection_end);
    	$('#resetButton').click(history_reset);
        $('#nextButton').click(history_next);
        $('#prevButton').click(history_prev);
        history_reset();
    }

    function selection_end(e) {
      	if (state == 'ready' && dragging) {
            dragging = false;
	    var p = trim_point(get_point(e));
	    if (point[0] == p[0] || point[1] == p[1])
	        return;
      	    draw_box(point, p);
	    if (point[0] > p[0])
	        set_new_bounds(p, point);
	    else 
	        set_new_bounds(point, p);
      	}
    }

    function selection_move(e) {
      	if (state == 'ready' && dragging) {
      	    draw_box(point, trim_point(get_point(e)));
        }						  
    }						  

    function selection_start(e) {
        if (state == 'ready') {
            var p = get_point(e);
            if (p[0] < ctx.canvas.width && p[1] < ctx.canvas.height) {
	        point = p;
                dragging = true;
                if (e.changedTouches)
                    e.preventDefault();
	    }
      	}
    }

    function set_new_bounds(upper_left, lower_right) {
        var bounds = history[history_index];
        var dx = bounds.width  / ctx.canvas.width;
        var dy = bounds.height / ctx.canvas.height;
	history_add({
            left: upper_left[0] * dx + bounds.left,
            bottom: (ctx.canvas.height - lower_right[1]) * dy + bounds.bottom,
            width: (lower_right[0] - upper_left[0]) * dx,
            height: (lower_right[1] - upper_left[1]) * dy,
        });
    }

    function trim_point(p) {
        if (p[0] < 0)
            p[0] = 0;
        else if (p[0] > ctx.canvas.width - 1)
	    p[0] = ctx.canvas.width - 1;
        if (p[1] < 0)
	    p[1] = 0;
        else if (p[1] > ctx.canvas.height - 1)
	    p[1] = ctx.canvas.height - 1;
        return p;
    }

    function update_button_state() {
	$('#resetButton').attr(
	    'class',
	    history.length > 1 ? '' : 'disabled'
	);
	$('#prevButton').attr(
	    'class',
	    history_index > 0 ? '' : 'disabled'
	);
	$('#nextButton').attr(
	    'class',
	    history_index < history.length - 1 ? '' : 'disabled'
	);
    }

    init();
});
