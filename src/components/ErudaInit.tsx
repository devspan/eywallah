import { useEffect } from 'react';

const ErudaInit = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('eruda').then((erudaModule) => {
        const eruda = erudaModule.default;
        if (eruda && typeof eruda.init === 'function') {
          eruda.init();
        } else {
          console.error('Eruda or eruda.init is not available');
        }
      });
    }
  }, []);

  return null;
};

export default ErudaInit;