import { BaseApiService } from "@/services/api";
import type {
  Character,
  CreateCharacterData,
  UpdateCharacterData,
} from "@/types";

class CharacterService extends BaseApiService {
  /**
   * 获取所有角色
   */
  async getAll(): Promise<Character[]> {
    return this.get<Character[]>("/characters");
  }

  /**
   * 根据ID获取角色
   */
  async getById(id: string): Promise<Character> {
    return this.get<Character>(`/characters/${id}`);
  }

  /**
   * 创建角色
   */
  async create(data: CreateCharacterData): Promise<Character> {
    return this.post<Character>("/characters", data);
  }

  /**
   * 更新角色
   */
  async update(data: UpdateCharacterData): Promise<Character> {
    return this.put<Character>(`/characters/${data.id}`, data);
  }

  /**
   * 删除角色
   */
  async remove(id: string): Promise<void> {
    return this.delete(`/characters/${id}`);
  }

  /**
   * 搜索角色
   */
  async search(query: string): Promise<Character[]> {
    return this.get<Character[]>(
      `/characters/search?q=${encodeURIComponent(query)}`,
    );
  }
}

export const characterApi = new CharacterService();
