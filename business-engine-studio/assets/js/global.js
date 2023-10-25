var $ = require( "jquery" );
 require( "metismenu" );
/*
 * Detact Mobile Browser
 */

if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    $('html').addClass('ismobile');
}

$(document).ready(function () {
    /* --------------------------------------------------------
        Layout
    -----------------------------------------------------------*/
    (function () {
        var bodyToggleStatus = localStorage.getItem('body-toggle-status');
        if (bodyToggleStatus == undefined || bodyToggleStatus == 'toggled') {
            $('body').addClass('toggled');
            $('#tw-switch').prop('checked', false);
        }
        else if (bodyToggleStatus == '') {
            $('body').removeClass('toggled');
            $('#tw-switch').prop('checked', true);
        }

        $('body').on('change', '#toggle-width input:checkbox', function () {
            if ($(this).is(':checked')) {
                setTimeout(function () {
                    $('body').removeClass('toggled');
                    localStorage.setItem('body-toggle-status', '');
                }, 50);
            }
            else {
                setTimeout(function () {
                    $('body').addClass('toggled');
                    localStorage.setItem('body-toggle-status', 'toggled');
                }, 50);
            }
        });
    })();

    /* --------------------------------------------------------
        Sidebar Menu
    -----------------------------------------------------------*/
    $('#sidebarMenu').metisMenu();

    $('.mobile-menu-icon').on('click', function (event) {
        event.preventDefault();
        $('#pageSidebar').toggleClass('toggled');
        return false;
    });

    $(window).on('click', function (event) {
        if ($(event.target).closest($('#pageSidebar')).length === 0) {
            setTimeout(function () {
                $('#pageSidebar').removeClass('toggled');
            });
        }
    });
});