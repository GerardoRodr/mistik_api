import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  it('debe estar definido', () => {
    expect(filter).toBeDefined();
  });

  it('debe capturar HttpException y retornar respuesta JSON estandarizada', () => {
    const statusMock = jest.fn().mockReturnThis();
    const jsonMock = jest.fn();

    const mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    const mockRequest = {
      url: '/api/v1/customers/uuid-invalido',
      method: 'GET',
    };

    const host = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;

    const exception = new HttpException(
      'Cliente no encontrado',
      HttpStatus.NOT_FOUND,
    );

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'Cliente no encontrado',
        path: '/api/v1/customers/uuid-invalido',
      }),
    );
  });
});
