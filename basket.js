/**
 *string number_format ( float number [, object cfg ] )

 Как видно выше, второй параметр (кстати, не обязательный) — объект. Для PHP передача такого параметра нетрадиционна, но все чаще встречается в js. Меня поймут все, кто хоть раз использовал jQuery или SWFObject, например.

 Параметр cfg имеет пять свойств:
 before — произвольные символы, которые будут вставлены перед числом (по-умолчание ничего)
 after — произвольные символы, которые будут вставлены после числа (по-умолчание ничего)
 decimals — число символов после запятой (точки :) (по-умолчанию 2)
 dec_point — разделитель между целой и дробной частями числа (по-умолчанию «.»)
 thousands_sep — разделитель тысяч в целой части числа (по-умолчанию «»)
 */
function number_format(_number, _cfg) {
    function obj_merge(obj_first, obj_second) {
        var obj_return = {};
        for (key in obj_first) {
            if (typeof obj_second[key] !== 'undefined')
                obj_return[key] = obj_second[key];
            else
                obj_return[key] = obj_first[key];
        }
        return obj_return;
    }

    function thousands_sep(_num, _sep) {
        if (_num.length <= 3)
            return _num;
        var _count = _num.length;
        var _num_parser = '';
        var _count_digits = 0;
        for (var _p = (_count - 1); _p >= 0; _p--) {
            var _num_digit = _num.substr(_p, 1);
            if (_count_digits % 3 == 0 && _count_digits != 0 && !isNaN(parseFloat(_num_digit)))
                _num_parser = _sep + _num_parser;
            _num_parser = _num_digit + _num_parser;
            _count_digits++;
        }
        return _num_parser;
    }

    if (typeof _number !== 'number') {
        _number = parseFloat(_number);
        if (isNaN(_number))
            return false;
    }
    var _cfg_default = {
        before: '',
        after: '',
        decimals: 2,
        dec_point: '.',
        thousands_sep: ''
    };
    if (_cfg && typeof _cfg === 'object') {
        _cfg = obj_merge(_cfg_default, _cfg);
    }
    else
        _cfg = _cfg_default;
    _number = _number.toFixed(_cfg.decimals);
    if (_number.indexOf('.') != -1) {
        var _number_arr = _number.split('.');
        var _number = thousands_sep(_number_arr[0], _cfg.thousands_sep) + _cfg.dec_point + _number_arr[1];
    }
    else
        var _number = thousands_sep(_number, _cfg.thousands_sep);
    return _cfg.before + _number + _cfg.after;
}


function true_end(chislo, n1, n2, n5) {
    var chislo = chislo.toString();
    var ch = chislo.slice(-1);
    var result;
    if (ch == 1) {
        if (chislo.length > 1) {
            result = chislo.slice(-2, 1) == 1 ? n5 : n1;
        } else {
            result = n1;
        }
    } else if (ch > 1 && ch < 5) {
        if (chislo.length > 1) {
            result = chislo.slice(-2, 1) == 1 ? n5 : n2;
        } else {
            result = n2;
        }
    } else {
        result = n5;
    }

    return result;
}


var basket = {
    COOKIE_BASKET: 'basket',
    COOKIE_ITEMS: 'items',
    COOKIE_TOTAL_COUNT: 'total_count',
    COOKIE_TOTAL_PRICE: 'total_price',
    basket: new Array(),
    total_count: 0,
    total_price: 0,
    delivery: 0,
    _cookie: undefined,
    _unser_cookie: new Object(),
    _change: false,

    /**
     * добавляем товар в корзину
     */
    add_basket: function (product) {
        this._read();
        var item, is_new = true;
        if (this.basket.length > 0) {

            for (var i in this.basket) {
                item = this.basket[i];
                if (item.id == product.id) {
                    item.count += product.count;
                    is_new = false;
                }
            }
            if (is_new) {
                this.basket.push(product);
            }
        } else {
            this.basket.push(product);
        }

        this._total_calculation();

        this._save();

        this._render();

        $.Growl.show({
            'message': 'товар добавлен в корзину',
            'timeout': 2000,
            'speed': 500
        });

        $('#modal-basket-popup').remove();

        $.post("core/action/basket.php", {flag: 'basket-popup'}, function (data) {
            if (data.success == 1) {
                $('body').append(data.html);
                $('#modal-basket-popup').modal('show');
            }
        }, "json");

        _gaq.push(['_trackPageview', '/ProductSelect']);

    },
    /**
     * обновляем указаный товар
     */
    update_item_basket: function (val, property, sources) {
        if (sources == '' || sources == undefined)
            sources = 0;
        val[property] = parseInt(sources);
    },
    /**
     * обновляем указаный товар корзине
     */
    update_basket: function (val, property, sources) {
        if (sources == '' || sources == undefined)
            sources = 0;

        for (var i in this.basket) {
            item = this.basket[i];
            if (item.id == val) {
                item[property] = parseInt(sources);
            }
        }

        this._change = true;
        this._total_calculation();
        this._render('no_read');
    },
    /**
     * обновляем указаный товар
     */
    delete_item_basket: function (val) {
        for (var i in this.basket) {
            if (this.basket[i].id == val) {
                this.basket.splice(i, 1);
            }
        }

        this._change = true;
        this._total_calculation();
        this._render('no_read');
    },
    /**
     * обновляем указаный товар
     */
    delete_basket: function () {
        this.basket = new Array();
        this._cookie = undefined;
        this._unser_cookie = new Object();
        this.total_count = 0;
        this.total_price = 0;
    },
    /**
     * функция пользовательских изменений на екране
     */
    render: function () {
    },
    /**
     * функция которая фиксирует иззменения на екране
     */

    _render: function (read) {
        if (read == undefined)
            this._read();
        this.render(this.basket, this.total_count, this.total_price);
    },
    /**
     * Глобальний подсчет суммы и цены
     */
    _total_calculation: function () {
        this.total_count = 0;
        this.total_price = 0;
        var item = true;
        for (var i in this.basket) {
            item = this.basket[i];
            this.total_count += item.count;
            this.total_price += item.db_price * item.count;
        }
        this.cost_delivery();
    },
    /**
     * ишет в куки
     */
    _save: function () {

        this._unser_cookie[this.COOKIE_TOTAL_COUNT] = this.total_count;
        this._unser_cookie[this.COOKIE_TOTAL_PRICE] = this.total_price;
        this._unser_cookie[this.COOKIE_ITEMS] = this.basket;
        $.cookie(this.COOKIE_BASKET, serialize(this._unser_cookie), {path: '/'});
    },
    /**
     * читаем с кукисов
     */
    _read: function () {
        this._cookie = $.cookie(this.COOKIE_BASKET);
        this._unser_cookie = unserialize(this._cookie);
        this.total_count = this._unser_cookie[this.COOKIE_TOTAL_COUNT];
        this.total_price = this._unser_cookie[this.COOKIE_TOTAL_PRICE];
        this.basket = this._objectInArray(this._unser_cookie[this.COOKIE_ITEMS]);
    },
    /**
     * Конвертирует обек в масив
     */
    _objectInArray: function (object) {
        var array = new Array();

        for (var item in object) {
            array.push(object[item]);
        }

        return array;
    },
    /**
     * Добавляет суму доставки к общей стоимости
     */
    cost_delivery: function () {

        var delivery = $("input[type='radio'].delivery:checked");

        if (delivery.length > 0 && delivery.val() == 5 && parseFloat(basket.total_price) < parseFloat(delivery.data('to'))) {
            //basket.total_price = parseFloat(basket.total_price) + parseFloat(delivery.data('sum'));
            this.delivery = parseFloat(delivery.data('sum'));
            $(".cost_delivery").show();
        } else {
            this.delivery = 0;
            $(".cost_delivery").hide();
        }

        $("input[name='record[db_delivery_value]']").val(this.delivery);
        $("#deliver_price").html(this.delivery);
    }

}

basket.render = function (items, total_count, total_price) {
    if (basket._change) {
        var item, price, total_price;
        for (var i in items) {
            item = items[i];
            $('.item_sum_' + item.id).text(number_format(item.db_price * item.count, {
                decimals: 0,
                thousands_sep: ' '
            }));
        }
        basket._save();
    }
    $('#total_price').text(number_format(basket.total_price + basket.delivery, {decimals: 0, thousands_sep: ' '}));
    if (total_count > 0) {
        $('.basket__amount-num').text(basket.total_count);
        $('.basket__price-num').text(number_format(basket.total_price + basket.delivery, {decimals: 0, thousands_sep: ' '}));
    }
};

$(document).ready(function () {

    basket._render();

    $(document).on('click', '.delete', function () {
        var id = $(this).data('id');
        $('#' + id).fadeOut();
        if (basket.total_count == 0)
            location.reload();
    });

    $(document).on('click', '#clear_basket', function () {
        if (confirm('Вы уверены что хотите очистить корзину')) {
            basket.delete_basket();
            basket._save();
            location.reload();
        }
    });

    $(".delivery").change(function () {
        basket._change = true;
        basket._total_calculation();
        basket._save();
        basket._render('no_read');
    });

    $("#basket-form").validate({
        rules: {
            'record[db_uname]': {
                required: true,
                notplaceholder: true,
                minlength: 3
            },
            /*'record[db_ufam]': {
             required: true,
             notplaceholder: true,
             minlength: 3
             },*/
            'record[db_utel]': {
                required: true,
                notplaceholder: true,
                phone: true,
                minlength: 3
            },
            /*'record[db_email]': {
             required: true,
             notplaceholder: true,
             email: true,
             minlength: 5
             },*/
        },
        submitHandler: function () {

            var form_data = $("#basket-form").serialize();
            form_data += '&package_order=1';

            $.post("core/action/order.php", form_data, function (data) {

                $.Growl.show({
                    'message': data.msg,
                    "timeout": GROWL_DEF_TIME,
                    'speed': 0
                });

                if (data.success == 1) {
                    $(".product-basket").html(data.msg);

                    //head_goods_count_obj.text('0');
                    //head_goods_price_obj.text('0.00');
                    //basket_middle_info_div.hide();

                    //table_container.hide();
                    //$('#ajax_loader').remove();
                    //table_container.html(data.your_order);

                    /*if (data.order) {
                     //console.log(data.order['goods']);
                     _gaq.push(['_addTrans',
                     data.order['id'], // transaction ID - required
                     '', // affiliation or store name
                     data.order['db_final_cost'], // total - required
                     '', // tax
                     '', // shipping
                     '', // city
                     '', // state or province
                     ''             // country
                     ]);

                     // add item might be called for every item in the shopping cart
                     // where your ecommerce engine loops through each item in the cart and
                     // prints out _addItem for each
                     var items = data.order['goods'];
                     for (var i in items) {
                     _gaq.push(['_addItem',
                     data.order['id'], // transaction ID - required
                     items[i].id, // SKU/code - required
                     items[i].db_namelang, // product name
                     '', // category or variation
                     items[i].db_price, // unit price - required
                     '1'               // quantity - required
                     ]);
                     //console.log(items[i].db_namelang);
                     }
                     _gaq.push(['_trackTrans']); //submits transaction to the Analytics servers

                     _gaq.push(['_trackPageview', '/basket/succes']);
                     }*/

                    //table_container.fadeIn();

                    $.cookie('basket', null, {path: '/'});

                    //console.log(data.order);
                    /*if (data.order.htmlPlaton) {
                     $.Growl.show({
                     'message': "Через три секунды вы будете перенаправлены на систему оплаты",
                     "speed": 500,
                     'timeout': false
                     });
                     window.setTimeout(function () {
                     $("#platonWebPayments").html(data.order.htmlPlaton);
                     $('#platonWebPayments').submit();
                     }, 4000); // время в мс
                     }*/

                } else {

                }

            }, "json");
        }
    });

    $('.fast_order').click(function (e) {
        e.preventDefault();
        var id = $(this).data('id');

        $('#modal-basket-popup').remove();
        $.post("core/action/basket.php", {flag: 'fast_order', id: id}, function (data) {
            if (data.success == 1) {

                $('body').append(data.html);
                $('#modal-fast-order-popup').last().modal('show');

                $("#fast_order_step1").validate({
                    rules: {
                        'record[db_uname]': {
                            required: true,
                            notplaceholder: true,
                            minlength: 3
                        },
                        'record[db_utel]': {
                            required: true,
                            notplaceholder: true,
                            phone: true,
                            minlength: 3
                        },
                    },
                    submitHandler: function () {
                        var form = $("#fast_order_step1");
                        var form_data = form.serialize();
                        form_data += '&flag=fast_order_step1';

                        $("#fast_order_step1").html('<h2>Ваша заказ обрабатывается системой</h2><div id="ajax_loader"></div>');
                        $.post('core/action/order.php', form_data, function (data) {
                            if (data.success == 1) {
                                $("#fast_order_step1").html(data.msg);
                                setTimeout("location.reload();", 5000);
                            } else {
                                $.Growl.show({
                                    'message': data.msg,
                                    'timeout': GROWL_DEF_TIME,
                                    'speed': 500
                                });
                            }
                        }, "json");
                    }
                });
            }
        }, "json");
    });
});




