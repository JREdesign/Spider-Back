// middlewareUtils.js
export const executeMiddlewaresSequentially = (middlewares) => {
    return (req, res, next) => {
      const executeMiddleware = (index) => {
        if (index === middlewares.length) {
          return next();
        }
        middlewares[index](req, res, (err) => {
          if (err) {
            return next(err);
          }
          executeMiddleware(index + 1);
        });
      };
      executeMiddleware(0);
    };
  };
  