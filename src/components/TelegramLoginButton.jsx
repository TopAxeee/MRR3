// src/components/TelegramLoginButton.jsx
import React, { useEffect, useRef } from 'react';

const TelegramLoginButton = ({ botName, onAuth, size = 'large', requestAccess = 'write' }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!botName) return;

    // Глобальный коллбэк, который вызовет виджет
    window.TelegramAuth = { onAuth: (user) => onAuth?.(user) };

    // Создаём скрипт виджета и настраиваем data-* атрибуты
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botName);        // имя бота без @
    script.setAttribute('data-size', size);
    script.setAttribute('data-onauth', 'TelegramAuth.onAuth(user)');
    script.setAttribute('data-request-access', requestAccess);

    // Очищаем контейнер и монтируем виджет именно сюда
    const el = containerRef.current;
    el.innerHTML = '';
    el.appendChild(script);

    // Чистим за собой при размонтировании
    return () => {
      if (el) el.innerHTML = '';
      delete window.TelegramAuth;
    };
  }, [botName, onAuth, size, requestAccess]);

  // Контейнер под кнопку
  return <div ref={containerRef} />;
};

export default TelegramLoginButton;
