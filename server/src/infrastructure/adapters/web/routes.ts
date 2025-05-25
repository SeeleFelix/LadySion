import { Router } from 'express';
import { CharacterController } from './CharacterController';
import { ConversationController } from './ConversationController';

/**
 * 创建角色路由
 */
export const createCharacterRoutes = (characterController: CharacterController): Router => {
  const router = Router();
  
  // 获取所有角色
  router.get('/', characterController.getAllCharacters);
  
  // 根据ID获取角色
  router.get('/:id', characterController.getCharacterById);
  
  // 创建角色
  router.post('/', characterController.createCharacter);
  
  // 更新角色
  router.put('/:id', characterController.updateCharacter);
  
  // 删除角色
  router.delete('/:id', characterController.deleteCharacter);
  
  return router;
};

/**
 * 创建会话路由
 */
export const createConversationRoutes = (conversationController: ConversationController): Router => {
  const router = Router();
  
  // 获取所有会话
  router.get('/', conversationController.getAllConversations);
  
  // 根据ID获取会话
  router.get('/:id', conversationController.getConversationById);
  
  // 创建会话
  router.post('/', conversationController.createConversation);
  
  // 发送消息并获取AI回复
  router.post('/:id/messages', conversationController.sendMessage);
  
  // 删除会话
  router.delete('/:id', conversationController.deleteConversation);
  
  return router;
}; 