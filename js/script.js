/*
Author: Saman Sedighi Rad
http://ssrad.org/
If you want to use the code, contact me: http://ssrad.org/contact
*/
(function () {
	'use strict';

/* ==========================================================================
   Complex numbers object
   ========================================================================== */

	function Complex(real, imaginary) {
	    this.real = real;
	    this.imaginary = imaginary;
	}

	Complex.prototype.add = function (c) {
	    this.real += c.real;
	    this.imaginary += c.imaginary;
	};

	Complex.prototype.sub = function (c) {
	    this.real -= c.real;
	    this.imaginary -= c.imaginary;
	};

	Complex.prototype.mul = function (c) {
	    this.real      = this.real * c.real - this.imaginary * c.imaginary;
	    this.imaginary = this.real * c.imaginary + this.imaginary * c.real;
	};

	Complex.prototype.div = function (c) {
	    var dividend = (c.real * c.real + c.imaginary * c.imaginary);
	    
	    this.real      = (this.real * c.real + this.imaginary * c.imaginary) / dividend;
	    this.imaginary = (this.imaginary * c.real - this.real * c.imaginary) / dividend;
	};

	Complex.prototype.toString = function () {
	    return "(" + this.real + ", " + this.imaginary +"*i)";
	};

	Complex.prototype.square = function () {
	    this.mul(this);
	};

/* ==========================================================================
   ColorRGBA
   ========================================================================== */

	function ColorRGBA(r, g, b, a) {
	    this.r = r;
	    this.g = g;
	    this.b = b;
	    this.a = a;
	};

	ColorRGBA.prototype.toString = function () {
	    return "rgba("+ this.r +","+ this.g +","+ this.b +","+ this.a +")";
	};

/* ==========================================================================
   Mandelbrot
   ========================================================================== */

	function Mandelbrot() {
		this.canvas = document.getElementById('cvs');

	    this.width  = $(this.canvas).width();
	    this.height = $(this.canvas).height();
		
		this.colors = {
			  r: null
			, g: null
			, b: null
			, updated: false
		};

	    this.context = this.canvas.getContext('2d');
	    this.imageData = this.context.createImageData(this.width, this.height);
	    this.palette = [];
	    this.maxIterations = 0;

	    this.rendered = false;
	}
	
	Mandelbrot.prototype.setColor = function (params) {
		this.colors[params.component] = params.color;
		this.colors.updated = true;
		
		Sliders.setLocation(this.getValues());
	};

	Mandelbrot.prototype.setInterations = function (n) {
	    if (this.maxIterations !== n) {
			this.maxIterations = n;
	    	this.initPalette();
		}
	};
	
	Mandelbrot.prototype.getValues = function () {
		return { it: this.maxIterations, r: this.colors['r'], g: this.colors['g'], b: this.colors['b'] }
	};

	/// Lookup table for the colors.
	Mandelbrot.prototype.initPalette = function () {
	    var i;

	    for (i = 0; i <= this.maxIterations; i++) {
	        this.palette[i] = new ColorRGBA(
	              128.0 + 127.0 * Math.sin(this.colors.r * i / this.maxIterations)
	            , 128.0 + 127.0 * Math.sin(this.colors.g * i / this.maxIterations)
	            , 128.0 + 127.0 * Math.sin(this.colors.b * i / this.maxIterations)
	            , 255
	        );
	    }
	};

	Mandelbrot.prototype.getPalette = function (i) {
	    return this.palette[i];
	};

	Mandelbrot.prototype.mandelPixel = function (c_re, c_im) {
	    var iteration;
	    var z_re1, z_re2, z_im1, z_im2, b;

	    z_re1 = 0;
	    z_im1 = 0;
	    z_re2 = 0;
	    z_im2 = 0;
	    b = 0;

	    iteration = 0;
	    while ((b < 100.0) && (iteration < this.maxIterations)) {
	        z_re2 = z_re1 * z_re1 - z_im1 * z_im1 + c_re;
	        z_im2 = 2 * z_re1 * z_im1 + c_im;
	        b = z_re2 * z_re2 + z_im2 * z_im2;

	        z_re1 = z_re2;
	        z_im1 = z_im2;

	        iteration += 1;
	    }
	    return iteration;
	};    

	Mandelbrot.prototype.compute = function () {
		if (this.colors.updated === true) {
			this.initPalette();
		}
		
	    var i1, i2, w, h;
	    var pixel;
	    var z_re, z_im, xScale, yScale, xOfs, yOfs;
	    var colorPixel;

	    w = this.width;
	    h = this.height;

	    xOfs = -w / 1.25;
	    yOfs = -h / 2.0;

	    xScale = 2.6 / w;
	    yScale = 2.6 / h;

	    for (i1 = 0; i1 < h; i1 += 1) {
	      for (i2 = 0; i2 < w; i2 += 1) {

	        z_re = (i2 + xOfs) * xScale;
	        z_im = (i1 + yOfs) * yScale;

	        pixel = this.mandelPixel(z_re, z_im);
	        colorPixel = this.getPalette(pixel);

	        this.setPixel({ "x": i2, "y": i1, "color": colorPixel });
	      }
	    }
	    this.draw();
	    this.rendered = true;
		this.colors.updated = false;
	};

	Mandelbrot.prototype.setPixel = function (data) {
	    var index = (data.x + data.y * this.width) * 4;

	    this.imageData.data[index+0] = data.color.r;
	    this.imageData.data[index+1] = data.color.g;
	    this.imageData.data[index+2] = data.color.b;
	    this.imageData.data[index+3] = data.color.a;
	};

	Mandelbrot.prototype.draw = function () {
	    this.context.putImageData(this.imageData, 0, 0);
	};

/* ==========================================================================
   Sliders
   ========================================================================== */

	function Sliders(mandel) {

		this.sliders = {
			  it: $('#slider_i').slider({
						min: 1
					  , max: 1000
					  , step: 10
					  , value: 40
					  , change : function (event, ui) {
						  $('h3#iterations').text('Iterations: ' + ui.value);
					  }
				  })
			, r:  $('#slider_r').slider({
						min: 0
					  , max: 255
					  , step: 1
					  , value: 21
					  , change : function (event, ui) {
						  $('h3#r').text('Red: ' + ui.value);
						  mandel.setColor({
							  component: "r",
							  color: ui.value
						  });
					  }
				  })
			, g:  $('#slider_g').slider({
						min: 0
					  , max: 255
					  , step: 1
					  , value: 17
					  , change : function (event, ui) {
						  $('h3#g').text('Green: ' + ui.value);
						  mandel.setColor({
							  component: "g",
							  color: ui.value
						  });
					  }
				  })
			, b:  $('#slider_b').slider({
						min: 0
					  , max: 255
					  , step: 1
					  , value: 53
					  , change : function (event, ui) {
						  $('h3#b').text('Blue: ' + ui.value);
						  mandel.setColor({
							  component: "b",
							  color: ui.value
						  });
					  }
				  })
		}
	}
	
	Sliders.prototype.getValue = function (params) {
		return this.sliders[params.slider].slider('value');
	};
	
	Sliders.prototype.setValue = function (params) {
		this.sliders[params.slider].slider('value', params.value);
	};
	
	Sliders.setLocation = function (params) {
		window.location.hash = '#' + [params.it, params.r, params.g, params.b].join('/');
	};
	
	Sliders.prototype.isValid = function (params) {
		var i;
		
		var template = { it:null, r:null, g:null, b:null };
		
		for (i in params) {
			
			if ((params[i] === '') || isNaN(params[i]) && (i in template)) {
				return false;
			}
		}
		
		return true;
	};
	
	Sliders.prototype.setSliders = function (params) {
		this.setValue({ slider: "it", value: params.it });
		this.setValue({ slider: "r", value: params.r });
		this.setValue({ slider: "g", value: params.g });
		this.setValue({ slider: "b", value: params.b });
		
		Sliders.setLocation(params);
	};
   
/* ==========================================================================
   Select box
   ========================================================================== */

	function Presets(sliders) {
		var i, s = "", self = this;
		
		this.values = {
			  "default": { label: "Default", it: 81,  r: 143, g: 36, b: 255 }
			, "demo_1":  { label: "Demo 1",  it: 351, r: 61, g: 218,  b: 137 }
			, "demo_2":  { label: "Demo 2",  it: 261, r: 42,  g: 42,  b: 31 }
			, "demo_3":  { label: "Demo 3",  it: 301, r: 180, g: 125, b: 211 }
			, "demo_4":  { label: "Demo 4",  it: 261, r: 87,  g: 143, b: 195 }
			, "demo_5":  { label: "Demo 5",  it: 201, r: 87,  g: 143, b: 24 }
			, "demo_6":  { label: "Demo 6",  it: 261, r: 73,  g: 48,  b: 54 }
			, "demo_7":  { label: "Demo 7",  it: 271, r: 156, g: 142, b: 149 }
			, "demo_8":  { label: "Demo 8",  it: 341, r: 232, g: 48,  b: 174 }
			, "demo_9":  { label: "Demo 9",  it: 381, r: 42, g: 73,  b: 106 }
			, "demo_10":  { label: "Demo 10",  it: 301, r: 117, g: 99,  b: 205 }
			, "demo_11":  { label: "Demo 11",  it: 321, r: 188, g: 24,  b: 80 }
		};
		
		this.select = $('#presets');
		this.select.change(function (event) {
			var data = self.values[this.value];
			sliders.setSliders({ it: data.it, r: data.r, g: data.g, b: data.b });
		});

		for(i in this.values) {
			this.select.append('<option value="'+ i +'">' + this.values[i].label + '</option>');
		}
		
		var args = window.location.hash.split('#')[1];
		var valid = false;
		if (args !== '') {
			var array = String(args).split('/');
			var o = { it: array[0], r: array[1], g: array[2], b: array[3] };
			valid = sliders.isValid(o);
			
			if (valid) {
				sliders.setSliders(o);
				$('#render').click();
			}
		}
		if (!valid) {
			sliders.setSliders(this.values['default']);
		}
	}
   
/* ==========================================================================
   Init code
   ========================================================================== */

	(function () {
		var mandel = new Mandelbrot();
		var sliders = new Sliders(mandel);

		var $save = $('#save');

		$('#render').click(function (event) {
			if (mandel.rendered === false) {
				$save.click(function (event) {
					window.open(mandel.canvas.toDataURL("image/png"));
				});
			}
			mandel.setInterations(sliders.getValue({ slider: "it" }));
			mandel.compute();
		});
		
		var presets = new Presets(sliders);
		
	}());

}());