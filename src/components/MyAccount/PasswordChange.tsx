import React from 'react';

const PasswordChange = () => {
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementar cambio de contraseña cuando Clerk esté activo
  };

  return (
    <div>
      <p className="font-medium text-xl sm:text-2xl text-dark mb-7">
        Password Change
      </p>

      <div className="bg-white shadow-1 rounded-xl p-4 sm:p-8.5">
        <form onSubmit={handlePasswordChange}>
          <div className="mb-5">
            <label htmlFor="oldPassword" className="block mb-2.5">
              Old Password
            </label>
            <input
              type="password"
              name="oldPassword"
              id="oldPassword"
              autoComplete="current-password"
              className="rounded-md border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20"
            />
          </div>

          <div className="mb-5">
            <label htmlFor="newPassword" className="block mb-2.5">
              New Password
            </label>
            <input
              type="password"
              name="newPassword"
              id="newPassword"
              autoComplete="new-password"
              className="rounded-md border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20"
            />
          </div>

          <div className="mb-5">
            <label htmlFor="confirmNewPassword" className="block mb-2.5">
              Confirm New Password
            </label>
            <input
              type="password"
              name="confirmNewPassword"
              id="confirmNewPassword"
              autoComplete="new-password"
              className="rounded-md border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20"
            />
          </div>

          <button
            type="submit"
            className="inline-flex font-medium text-white bg-blue py-3 px-7 rounded-md ease-out duration-200 hover:bg-blue-dark"
          >
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordChange;
