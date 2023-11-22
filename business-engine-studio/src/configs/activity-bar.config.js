export const activityBarItems = [{
        name: "application-menu",
        title: "Application Menu",
        icon: "menu",
    },
    {
        name: "explorer",
        title: "Explorer",
        icon: "files",
    },
    {
        name: "builder",
        title: "Builder",
        icon: "symbol-color",
    },
    {
        name: "page-resources",
        title: "Site Page Resources",
        icon: "multiple-windows",
        callback: "onGotoPageResources"
    },
    {
        name: "libraries",
        title: "Libraries",
        icon: "library",
        callback: "onGotoLibraries"
    },
    {
        name: "extensions",
        title: "Extensions",
        icon: "extensions",
        callback: "onGotoExtensions"
    },
];