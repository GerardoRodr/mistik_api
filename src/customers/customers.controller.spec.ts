import { Test, TestingModule } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

describe('CustomersController', () => {
  let controller: CustomersController;

  const mockCustomersService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
      controllers: [CustomersController],
      providers: [
        {
          provide: CustomersService,
          useValue: mockCustomersService,
        },
      ],
    }).compile();

    controller = module.get<CustomersController>(CustomersController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debe delegar findAll al servicio', async () => {
    const query = { page: 1, limit: 10, search: 'test' };
    const expected = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
    mockCustomersService.findAll.mockResolvedValue(expected);

    const result = await controller.findAll(query);
    expect(result).toEqual(expected);
    expect(mockCustomersService.findAll).toHaveBeenCalledWith(query);
  });

  it('debe delegar findById al servicio', async () => {
    const expected = { id: 'c-1', firstName: 'Juan' };
    mockCustomersService.findById.mockResolvedValue(expected);

    const result = await controller.findById('c-1');
    expect(result).toEqual(expected);
    expect(mockCustomersService.findById).toHaveBeenCalledWith('c-1');
  });

  it('debe delegar create al servicio', async () => {
    const dto = {
      documentType: 'DNI',
      documentNumber: '11223344',
      firstName: 'Ana',
      lastName: 'Gomez',
    };
    const expected = { id: 'c-2', ...dto };
    mockCustomersService.create.mockResolvedValue(expected);

    const result = await controller.create(dto);
    expect(result).toEqual(expected);
    expect(mockCustomersService.create).toHaveBeenCalledWith(dto);
  });

  it('debe delegar update al servicio', async () => {
    const dto = { firstName: 'Ana Maria' };
    const expected = { id: 'c-2', firstName: 'Ana Maria' };
    mockCustomersService.update.mockResolvedValue(expected);

    const result = await controller.update('c-2', dto);
    expect(result).toEqual(expected);
    expect(mockCustomersService.update).toHaveBeenCalledWith('c-2', dto);
  });
});
