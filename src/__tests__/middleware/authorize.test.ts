import { Request, Response, NextFunction } from 'express';
import { authorize } from '../../middleware/authorize';

describe('Authorize Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      currentUser: { _id: '123', email: 'test@example.com' },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  it('should allow access for authorized L1 user', () => {
    mockRequest.userRole = 'L1';
    const middleware = authorize(['L1']);

    middleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should allow access for authorized L2 user', () => {
    mockRequest.userRole = 'L2';
    const middleware = authorize(['L2']);

    middleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should allow access for authorized L3 user', () => {
    mockRequest.userRole = 'L3';
    const middleware = authorize(['L3']);

    middleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should allow access when user role is in allowed roles array', () => {
    mockRequest.userRole = 'L2';
    const middleware = authorize(['L1', 'L2', 'L3']);

    middleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should deny access for unauthorized L1 user trying to access L2 endpoint', () => {
    mockRequest.userRole = 'L1';
    const middleware = authorize(['L2']);

    middleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Access denied',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should deny access for L2 user trying to access L3 endpoint', () => {
    mockRequest.userRole = 'L2';
    const middleware = authorize(['L3']);

    middleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Access denied',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should deny access when userRole is not set', () => {
    mockRequest.userRole = undefined;
    const middleware = authorize(['L1', 'L2', 'L3']);

    middleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'No role assigned',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
