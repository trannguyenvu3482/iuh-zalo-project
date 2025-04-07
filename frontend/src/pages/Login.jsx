import { useMutation } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/apiAuth';
import HamburgerIcon from '../assets/icons/hamburger.png';
import lock from '../assets/icons/lock.png';
import ZaloPCLogo from '../assets/icons/zalo-pc.png';
import ZaloLogo from '../assets/imgs/logo.png';
import { LoadingSpinner } from '../components';
import { useUserStore } from '../zustand/userStore';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const navigate = useNavigate();
  const { setIsAuthenticated, setUser, setAccessToken } = useUserStore();
  const { enqueueSnackbar } = useSnackbar();
  const { t, i18n } = useTranslation();

  const [isUsingQRLogin, setIsUsingQRLogin] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: ({ username, password }) => login(username, password),
    onSuccess: (response) => {
      if (response.statusCode === 401) {
        throw new Error(t('invalidPassword'));
      } else if (response.statusCode === 404) {
        throw new Error(t('phoneNotFound'));
      }

      const { accessToken, user } = response.data;
      setUser(user);
      setAccessToken(accessToken);
      setIsAuthenticated(true);
      enqueueSnackbar(t('loginSuccess'), { variant: 'success' });
      setTimeout(() => navigate('/'), 1000);
    },
    onError: (err) => {
      const errorMessage =
        err.message === t('invalidPassword') || err.message === t('phoneNotFound')
          ? err.message
          : t('loginFailed');
      enqueueSnackbar(errorMessage, { variant: 'error' });
    },
  });

  const handleLoginWithPassword = (e) => {
    e.preventDefault();
    if (!isValidPhoneNumber(phoneNumber)) {
      enqueueSnackbar(t('invalidPhone'), { variant: 'error' });
      return;
    }

    const username = phoneNumber.replace('+84', '0');
    mutate({ username, password });
  };

  const isValidPhone = (phoneNumber) => {
    try {
      return isValidPhoneNumber(phoneNumber);
    } catch (error) {
      return false;
    }
  };

  return (
    <>
      <Helmet>
        <title>Zalo - {t('loginWithPassword')}</title>
      </Helmet>

      {isPending ? (
        <LoadingSpinner />
      ) : (
        <div className="wrapper h-screen w-screen bg-[#e9f3ff]">
          <div className="flex flex-col items-center justify-center pt-16">
            <img className="h-auto w-[105px]" src={ZaloLogo} />
            <div className="mt-4 text-center">
              <p>{t('title')}</p>
              <p>{t('subtitle')}</p>
            </div>

            <div className="mt-4 w-[540px] max-w-[540px] rounded-xl bg-white">
              <div className="top flex w-full items-center rounded-tl-xl rounded-tr-xl">
                <div className="relative flex min-h-14 flex-1 items-center justify-center border-b border-[#f0f0f0] px-6">
                  <h1 className="font-semibold">
                    {isUsingQRLogin ? t('loginWithQR') : t('loginWithPassword')}
                  </h1>
                  <div className="absolute right-4">
                    {isUsingQRLogin && (
                      <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex items-center justify-center rounded-md border bg-white px-3.5 py-2.5"
                      >
                        <img src={HamburgerIcon} alt="hamburger" />
                      </button>
                    )}
                  </div>

                  {isOpen && (
                    <div className="menu absolute right-4 top-[46px] z-10 flex w-[200px] flex-col items-center justify-center rounded-md border border-[#f0f0f0] bg-white px-1 py-2 shadow-xl">
                      <button
                        onClick={() => {
                          setIsUsingQRLogin(false);
                          setPhoneNumber('');
                          setIsOpen(false);
                        }}
                        className="cursor-pointer text-sm"
                      >
                        {t('loginWithPassword')}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="body flex w-full items-center">
                <div className="relative flex min-h-14 flex-1 items-center justify-center px-6">
                  {isUsingQRLogin ? (
                    <div className="mt-[42px] flex min-h-[300px] w-[236px] flex-col items-center rounded-xl border border-[#f0f0f0]">
                      <img
                        src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Example"
                        alt=""
                      />
                      <p className="mt-1 text-blue-600">{t('onlyForLogin')}</p>
                      <p className="mt-1">{t('zaloPCFooter')}</p>
                    </div>
                  ) : (
                    <form onSubmit={handleLoginWithPassword}>
                      <PhoneInput
                        className="mt-[42px] border-b p-2"
                        numberInputProps={{
                          style: {
                            border: 'none',
                            outline: 'none',
                            backgroundColor: 'transparent',
                            width: '100%',
                          },
                        }}
                        international
                        placeholder={t('phonePlaceholder')}
                        countryCallingCodeEditable={false}
                        defaultCountry="VN"
                        value={phoneNumber}
                        onChange={setPhoneNumber}
                      />
                      <div className="mt-2 flex w-full items-center gap-4 border-b p-2">
                        <img src={lock} alt="" />
                        <input
                          type="password"
                          className="background-transparent outline-none"
                          placeholder={t('passwordPlaceholder')}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                      <button
                        disabled={!isValidPhone(phoneNumber)}
                        type="submit"
                        className="mt-8 flex w-full flex-1 items-center justify-center rounded-md bg-[#0191f4] px-1 py-3 text-sm text-white hover:bg-[#007bff] disabled:opacity-50"
                      >
                        {t('loginWithPassword')}
                      </button>

                      <button
                        onClick={() => alert('Chức năng chưa phát triển...')}
                        className="flex w-full flex-1 items-center justify-center rounded-md px-1 py-3 text-sm hover:opacity-70"
                      >
                        {t('forgotPassword')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsUsingQRLogin(true);
                          setIsOpen(false);
                          setPhoneNumber('');
                        }}
                        className="mt-4 flex w-full flex-1 items-center justify-center rounded-md px-1 py-3 text-sm font-semibold text-[#0190f3] hover:opacity-70"
                      >
                        {t('loginWithQR')}
                      </button>
                    </form>
                  )}
                </div>
              </div>

              <div className="bottom mx-4 mb-2 mt-8 flex h-[100px] flex-row items-center rounded-xl border border-[#c0c0c0] px-2">
                <img src={ZaloPCLogo} alt="" />
                <div className="ml-3 flex w-full items-center justify-between gap-4">
                  <div className="flex w-[300px] flex-col">
                    <p className="text-sm font-bold">{t('zaloPCHeader')}</p>
                    <p className="text-sm">{t('zaloPCDesc')}</p>
                  </div>
                  <button className="flex flex-1 items-center justify-center rounded-md bg-[#0167ff] px-1 py-2 font-semibold text-white">
                    {t('downloadNow')}
                  </button>
                </div>
              </div>
            </div>

            <div className="mx-4 mb-2 mt-24 flex-row items-center justify-between rounded-xl border-[#c0c0c0] px-2">
              <button
                onClick={() => i18n.changeLanguage('vi')}
                className="mr-2 text-xs font-bold text-blue-500"
              >
                Tiếng Việt
              </button>
              <button
                onClick={() => i18n.changeLanguage('en')}
                className="text-xs text-blue-500"
              >
                English
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;
