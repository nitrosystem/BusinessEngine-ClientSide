config.$inject = ["$httpProvider", "$locationProvider"];

export function config($httpProvider, $locationProvider) {
    $httpProvider.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false,
        rewriteLinks: false,
    });
}