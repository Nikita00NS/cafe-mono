'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { login as apiLogin, IS_DEMO } from '@/lib/api-client';

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiLogin(password);
      if (!data.ok) {
        setError(data.error || 'Не удалось войти');
        return;
      }
      router.replace('/admin');
      router.refresh();
    } catch {
      setError('Сеть недоступна, попробуйте ещё раз');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login">
      <form className="login-card" onSubmit={submit}>
        <span className="login-card__mark">МОНО</span>
        <div>
          <h1 className="login-card__title">Панель заказов</h1>
          <p className="login-card__text">
            Введите пароль администратора, чтобы принимать заказы и управлять меню.
          </p>
        </div>

        <div className="field">
          <label className="admin-label" htmlFor="admin-password">
            Пароль
          </label>
          <input
            id="admin-password"
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            autoFocus
          />
        </div>

        {error && <div className="form-error">{error}</div>}

        <button type="submit" className="btn btn--light btn--block" disabled={loading || !password}>
          {loading ? 'Проверяем…' : 'Войти'}
        </button>

        <p className="login-hint">
          Пароль по умолчанию — <strong>mono2026</strong>.{' '}
          {IS_DEMO
            ? 'Демо-режим: заказы и настройки хранятся в этом браузере.'
            : 'Задайте свой в переменной окружения ADMIN_PASSWORD.'}{' '}
          <br />
          <Link href="/" style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Вернуться на сайт
          </Link>
        </p>
      </form>
    </div>
  );
}
