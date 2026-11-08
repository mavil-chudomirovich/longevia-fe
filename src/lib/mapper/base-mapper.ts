import { PagedResult } from '@/types/api';
import { safeArray } from './field-helpers';

/**
 * Interface chuẩn cho tất cả Mapper (từ DTO Backend sang Domain Model Frontend)
 */
export interface IMapper<TDto, TModel> {
  toModel(dto: TDto | null | undefined): TModel;
  toModelList(dtos: (TDto | null | undefined)[] | null | undefined): TModel[];
  toPaginationModel(paginationDto: PagedResult<TDto> | null | undefined): PagedResult<TModel>;
}

/**
 * Interface hỗ trợ chuyển đổi hai chiều (DTO <-> Model)
 * Thường dùng khi submit Form hoặc gửi payload Create/Update lên Backend
 */
export interface IBidirectionalMapper<
  TDto,
  TModel,
  TCreateReq = Partial<TDto>,
  TUpdateReq = Partial<TDto>,
> extends IMapper<TDto, TModel> {
  toCreateDto(domain: Partial<TModel>): TCreateReq;
  toUpdateDto(domain: Partial<TModel>): TUpdateReq;
}

/**
 * Abstract Base Class triển khai sẵn các logic xử lý mảng và phân trang
 */
export abstract class BaseMapper<TDto, TModel> implements IMapper<TDto, TModel> {
  /**
   * Phương thức trừu tượng: chuyển 1 đối tượng DTO thành Domain Model sạch
   */
  abstract toModel(dto: TDto | null | undefined): TModel;

  /**
   * Chuyển mảng DTO thành mảng Domain Model, tự động bảo vệ null/undefined
   */
  toModelList(dtos: (TDto | null | undefined)[] | null | undefined): TModel[] {
    return safeArray<TDto | null | undefined, TModel>(dtos, (item) => this.toModel(item));
  }

  /**
   * Chuyển cấu trúc phân trang PagedResult<TDto> sang PagedResult<TModel>
   */
  toPaginationModel(paginationDto: PagedResult<TDto> | null | undefined): PagedResult<TModel> {
    if (!paginationDto) {
      return {
        items: [],
        pageNumber: 1,
        pageSize: 20,
        totalCount: 0,
        totalPages: 0,
      };
    }

    return {
      items: this.toModelList(paginationDto.items),
      pageNumber: paginationDto.pageNumber,
      pageSize: paginationDto.pageSize,
      totalCount: paginationDto.totalCount,
      totalPages: paginationDto.totalPages,
      hasPreviousPage: paginationDto.hasPreviousPage,
      hasNextPage: paginationDto.hasNextPage,
    };
  }
}

/**
 * Abstract Class cho Mapper 2 chiều
 */
export abstract class BaseBidirectionalMapper<
  TDto,
  TModel,
  TCreateReq = Partial<TDto>,
  TUpdateReq = Partial<TDto>,
>
  extends BaseMapper<TDto, TModel>
  implements IBidirectionalMapper<TDto, TModel, TCreateReq, TUpdateReq>
{
  abstract toCreateDto(domain: Partial<TModel>): TCreateReq;
  abstract toUpdateDto(domain: Partial<TModel>): TUpdateReq;
}
