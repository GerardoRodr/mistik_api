import { Test, TestingModule } from '@nestjs/testing';
import { WholesalersController } from './wholesalers.controller';
import { WholesalersService } from './wholesalers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('WholesalersController', () => {
  let controller: WholesalersController;
  let service: WholesalersService;

  const mockWholesaler = {
    id: 'w-1',
    code: 'COSTAMAR',
    name: 'Costamar Travel',
    type: 'WHOLESALER',
    ruc: '20123456789',
    contactEmail: 'operaciones@costamar.com',
    contactPhone: '+5116169000',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockWholesalersService = {
    findAll: jest.fn().mockResolvedValue([mockWholesaler]),
    findById: jest.fn().mockResolvedValue(mockWholesaler),
    create: jest.fn().mockResolvedValue(mockWholesaler),
    update: jest.fn().mockResolvedValue(mockWholesaler),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WholesalersController],
      providers: [
        {
          provide: WholesalersService,
          useValue: mockWholesalersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<WholesalersController>(WholesalersController);
    service = module.get<WholesalersService>(WholesalersService);
    jest.clearAllMocks();
  });

  it('debe estar definido el controlador', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('debe invocar a wholesalersService.findAll con valor booleano', async () => {
      mockWholesalersService.findAll.mockResolvedValue([mockWholesaler]);

      const result = await controller.findAll({ active: true });

      expect(result).toHaveLength(1);
      expect(mockWholesalersService.findAll).toHaveBeenCalledWith(true);
    });

    it('debe invocar a wholesalersService.findAll con true por defecto si no se envia active', async () => {
      mockWholesalersService.findAll.mockResolvedValue([mockWholesaler]);

      const result = await controller.findAll({});

      expect(result).toHaveLength(1);
      expect(mockWholesalersService.findAll).toHaveBeenCalledWith(true);
    });
  });

  describe('findById', () => {
    it('debe invocar a wholesalersService.findById con el ID especificado', async () => {
      mockWholesalersService.findById.mockResolvedValue(mockWholesaler);

      const result = await controller.findById('w-1');

      expect(result.id).toBe('w-1');
      expect(mockWholesalersService.findById).toHaveBeenCalledWith('w-1');
    });
  });

  describe('create', () => {
    it('debe invocar a wholesalersService.create con el DTO ingresado', async () => {
      const dto = { code: 'LATAM', name: 'LATAM Airlines', type: 'AIRLINE' };
      mockWholesalersService.create.mockResolvedValue({ id: 'w-2', ...dto });

      const result = await controller.create(dto);

      expect(result.id).toBe('w-2');
      expect(mockWholesalersService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('debe invocar a wholesalersService.update con ID y DTO', async () => {
      const dto = { name: 'Costamar Travel SAC' };
      mockWholesalersService.update.mockResolvedValue({
        ...mockWholesaler,
        ...dto,
      });

      const result = await controller.update('w-1', dto);

      expect(result.name).toBe('Costamar Travel SAC');
      expect(mockWholesalersService.update).toHaveBeenCalledWith('w-1', dto);
    });
  });
});
