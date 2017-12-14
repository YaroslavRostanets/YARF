/**
 * Created by Yaroslav on 14.12.2017.
 */
(function( $ ){
    var RADIO = 'radio';
    $.fn.yarf = function( options ) {
        $(this).each(function(i,item){
            var type = $(item).context.type;
            switch (type){
                case RADIO:
                    radioCustomInit(item);
                    addHeandlers(item);
                    break;
                default:
                    break;
            }
        });
    };
})( jQuery );

function radioCustomInit(radioBtn){
    var _this = $(radioBtn);
    _this.wrap(
        _this.prop("checked")
            ?"<div class='yarf-radio checked'></div>"
            :"<div class='yarf-radio'></div>"
        );
    _this.after("<div class='yarf-radio-marker'></div>");
}
function radioCustomResresh(radioBtn){
    var _this = $(radioBtn);
    _this.closest(".yarf-radio").find(".yarf-radio-marker").remove();
    _this.unwrap(".yarf-radio");
    radioCustomInit(radioBtn);
}
function addHeandlers(radioBtn){
    $(radioBtn).on("change",function(){
        var name = $(radioBtn).attr("name");
        var thisNamedRadio = $("[name=" + name + "]");
        thisNamedRadio.each(function(i,item){
           radioCustomResresh(item);
        });
        console.log(thisNamedRadio);
    });
}

(function(){
    $("[data-yarf]").yarf();
})();