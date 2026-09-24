import { Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react';

import { hooks } from '../hooks';
import { custom } from '../custom';
import { svg } from '../assets/svg';
import { actions } from '../store/actions';
import { components } from '../components';

import background from '../assets/bg/03.png';

export const SignIn: React.FC = () => {
  const dispatch = hooks.useDispatch();

  const [rememberMe, setRememberMe] = useState<boolean>(false);

  hooks.useThemeColor('#fff');

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor('#fff'));
  }, []);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        // showGoBack={true}
        headerStyle={{ backgroundColor: 'var(--white-color)' }}
      />
    );
  };

  const renderContent = (): JSX.Element => {
    return (
      <main className='scrollable'>
        <div
          style={{
            backgroundImage: `url(${background})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            marginTop: 16,
            marginLeft: 20,
            marginRight: 20,
            marginBottom: 20,
            paddingBottom: 20,
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: '16%',
            borderRadius: 20,
          }}
        >
       
          <h1
            style={{
              textAlign: 'center',
              marginBottom: 16,
              textTransform: 'capitalize',
            }}
          >
            Welcome Back!
          </h1>
          <span
            className='t18'
            style={{ textAlign: 'center', display: 'block', marginBottom: 30 }}
          >
            Use social networks or your email
          </span>
          <custom.InputField
            containerStyle={{ marginBottom: 16 }}
            placeholder='dominicparker@mail.com'
            icon={<svg.CheckSvg />}
          />
          <custom.InputField
            containerStyle={{ marginBottom: 16 }}
            placeholder='••••••••'
            icon={<svg.EyeOffSvg />}
          />
          <div
            className='row-center-space-between'
            style={{ marginBottom: 30 }}
          >
            <div className='row-center clickable'>
              <div
                className='row-center clickable'
                onClick={() => setRememberMe(!rememberMe)}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 5,
                    backgroundColor: 'var(--white-color)',
                    border: '1px solid #C8CDD9',
                    marginRight: 6,
                  }}
                  className='center'
                >
                  {rememberMe && <svg.RememberCheckSvg />}
                </div>
                <span
                  className='t18'
                  style={{ marginTop: 2.4 }}
                >
                  Remember me
                </span>
              </div>
            </div>
            <Link
              className='t18'
              to=''
              style={{
                color: 'var(--main-color)',
                marginTop: 2.4,
              }}
            >
              Lost your password?
            </Link>
          </div>
          <components.Button
            text='Sign in'
            to='/reviews'
            containerStyle={{ marginBottom: 24 }}
          />
          <div
            className='t18'
            style={{ textAlign: 'center' }}
          >
            No account?{' '}
            <Link
              to='/sign-up'
              style={{ color: 'var(--main-color)' }}
            >
              Register now
            </Link>{' '}
          </div>
        </div>
      </main>
    );
  };

  return (
    <>
      {renderHeader()}
      {renderContent()}
    </>
  );
};
