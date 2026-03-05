// frontend/js/theme.js
const ThemeManager = (() => {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);

    return {
        toggle: () => {
            const current = document.documentElement.getAttribute('data-theme');
            const target = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', target);
            localStorage.setItem('theme', target);
            return target;
        },
        getTheme: () => document.documentElement.getAttribute('data-theme')
    };
})();
