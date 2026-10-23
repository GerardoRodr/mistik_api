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

  it('debe capturar errores de carga util con status 413 y formatear adecuadamente', () => {
    const statusMock = jest.fn().mockReturnThis();
    const jsonMock = jest.fn();

    const mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    const mockRequest = {
      url: '/api/v1/ai/ocr-passport',
      method: 'POST',
    };

    const host = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;

    const payloadError = Object.assign(new Error('request entity too large'), {
      status: 413,
      type: 'entity.too.large',
    });

    filter.catch(payloadError, host);

    expect(statusMock).toHaveBeenCalledWith(413);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 413,
        error: 'Payload Too Large',
        path: '/api/v1/ai/ocr-passport',
      }),
    );
  });
});
