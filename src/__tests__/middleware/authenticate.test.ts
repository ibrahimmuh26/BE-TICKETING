import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { createAuthenticatedUser } from '../utils/testHelpers';

describe('Authenticate Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  it('should authenticate with valid Bearer token', async () => {
    const { user, token } = await createAuthenticatedUser();

    mockRequest.headers = {
      authorization: `Bearer ${token}`,
    };

    await authenticate(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalled();
    expect(mockRequest.userId).toBe(user._id.toString());
    expect(mockRequest.userEmail).toBe(user.email);
    expect(mockRequest.userRole).toBe('L1');
  });

  it('should reject request without authorization header', async () => {
    mockRequest.headers = {};

    await authenticate(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'UnAuthenticated',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should reject request with invalid authorization format', async () => {
    mockRequest.headers = {
      authorization: 'InvalidFormat token',
    };

    await authenticate(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'UnAuthenticated',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should reject request with invalid token', async () => {
    mockRequest.headers = {
      authorization: 'Bearer invalid.token.here',
    };

    await authenticate(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Invalid token',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should reject request if user not found', async () => {
    const { token } = await createAuthenticatedUser();

    // Use token but delete the user from database
    const UserModel = (await import('../../models/User')).default;
    await UserModel.deleteMany({});

    mockRequest.headers = {
      authorization: `Bearer ${token}`,
    };

    await authenticate(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'User not found. Token may be invalid.',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
