const oooh = {
	setupCalendar: function(sel, time) {
		let datePicker = '';
	    $(sel).appendDtpicker({
	    	"onInit": function(handler) {
				datePicker = handler;
			},
	    	dateOnly: true,
	    	current:  time,
	    	closeOnSelected: true
	    })
	    .on('focusout', function() {
	    	setTimeout(function(){datePicker.getPicker().hide();}, 100);
	    });
	    return datePicker;
	},
	queryServer: function() {
		const that = this;
		$.ajax({
			url: '/api',
			type: 'POST',
			data: {
				startDate: $('.form_datetime_start').val(),
				endDate: $('.form_datetime_end').val(),
				email: $('.email').val(),
				password: $('.password').val()
			},
			complete: function() {
				$('.results_area').show();
			},
			success: function(data) {
				if (data.status === 'success') {
					//display stuff
					that.displayResults(data.content);
				}
				else if (data.status === 'error') {
					that.displayError(data.message);
				}
			},
			error: function(data) {
				that.displayError(JSON.stringify(data));

			}
		})
	},
	    //recycled tooltip code    
    tooltip: function(el,opts) {
        opts = opts || {};
        opts.css = opts.css || {};
        var $tt = $("<div class='tooltip_cm'></div>");
        $tt.css($.extend({
            position: "absolute",
            maxWidth: "300px",
            borderRadius: "5px",
            background: "#000",
            color: "#fff",
            padding: "10px",
            fontSize: "10px",
            marginLeft: "10px",
            marginTop: "15px",
            cursor: "pointer",
            display: "none",
            opacity: 1,
            zIndex: "300000"
        },opts.css));
         
        //remove Past events
        $(el).css({
        cursor: "pointer"
        });
        $(el).off(".tooltip");
         
        $(el).on("mouseover.tooltip mousemove.tooltip", function(e){
            if ($(this).attr("data-tooltip")!=undefined){
                $tt.html($(this).attr("data-tooltip"));
                var posx = 0;
                var posy = 0;
                if (!e) 
                    var e = window.event;
                if (e.pageX || e.pageY) {
                    posx = e.pageX;
                    posy = e.pageY;
                }
                else if (e.clientX || e.clientY) {
                    posx = e.clientX + document.body.scrollLeft
                        + document.documentElement.scrollLeft;
                    posy = e.clientY + document.body.scrollTop;
                        + document.documentElement.scrollTop;
                }
                if ($("body").find(".tooltip_cm").length <=0){
                    $("body").append($tt)
                    //$tt.clearQueue().stop()
                    $tt.show();
                }else{
                    $tt=$("body").find(".tooltip_cm");
                }
                $tt.css({
                    top: posy,
                    left: posx
                });
            }else{
                $(this).trigger("mouseout.tooltip");
                $tt.clearQueue().stop();
                $(".tooltip_cm").remove();
                $tt.remove();
            }
        });
        $(el).on("mouseout.tooltip", function(){
            $tt.clearQueue().stop();
            $tt.remove();
            $(".tooltip_cm").remove();
        });
    },
 
	displayResults: function(results) {
		console.log(results);
		let $monthDiv, $header, $appt;
		$('.results_area').empty();
		for (let monthKey in results) {
			let monthObj = results[monthKey];
			$monthDiv = $('<div class="monthSection"></div>').hide();
			$header = $('<div class="monthHeader"></div>');
			$header.html(monthObj.name);
			$monthDiv.append($header);
			for (let j =0; j <  31; j++) {
				let dateKey = (j > 9) ? j.toString() : '0' + j.toString();
				if (monthObj.items[dateKey] !== undefined) {
					for (let i = 0; i < monthObj.items[dateKey].length; i++) {
						let appt = monthObj.items[dateKey][i];
						$appt = $('<div class="appt"></div>');
				
						
						$appt.html(
							'<span class="name">' + appt.name + ':</span> ' +
							'<span class="dates">' + appt.dates + '</span>' +
							'<span class="type">(' + appt.type.toUpperCase() + ')</span>'
						);
						let info = '<div class=\"info_wpr\">' + 
							'<div class=\"subject\">' + appt.subject + '</div>' +
							'<div class=\"fullDates\">' + appt.fullDates + '</div>' + '</div>';
						$appt.find('.name').attr('data-tooltip', info);
						this.tooltip($appt.find('.name'));
						$monthDiv.append($appt);
					}
				}
				
			}
			$('.results_area').append($monthDiv);
		}
		$('.results_area .monthSection').fadeIn();
	},
	displayError: function(msg) {
		let $errorMsg = $('<div class="error"></div>').hide();
		$errorMsg.html(msg);
		$('.results_area').empty().append($errorMsg);
		$('.results_area .error').fadeIn();
	},	
	init: function() {
		let that = this;
		$('.email').val(localStorage.getItem('email'));
		this.setupCalendar('.form_datetime_start');
		this.setupCalendar('.form_datetime_end', moment(new Date()).add(3, 'months').format('YYYY-MM-DD'));
		$('.submitBtn').on('click', function() {
			that.queryServer();
			localStorage.setItem('email', $('.email').val());
		});
	}
}

$(function(){
	oooh.init();
});