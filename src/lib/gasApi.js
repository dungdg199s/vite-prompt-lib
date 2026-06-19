const google = window.google || {
  scripts: {
    run: () => {
      throw new Error("Google Scripts API not available");
    },
  },
};

export const invoke = (name, payload) => {
  google.scripts.run(name, payload);
};
