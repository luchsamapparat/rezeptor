import { describe, expect, it } from 'vitest';
import { FileSystemMock } from '../../tests/mocks/fileSystem.mock';
import { FileRepository } from './FileRepository';

describe('FileRepository', () => {
  describe('remove', () => {
    it('should not throw when removing a non-existent file', async () => {
      // given:
      const fileSystemMock = new FileSystemMock();
      const repository = new FileRepository('/test-dir', fileSystemMock);

      // when/then: removing a non-existent file should not throw
      await expect(repository.remove('non-existent-file.txt')).resolves.toBeUndefined();
    });

    it('should successfully remove an existing file', async () => {
      // given:
      const fileSystemMock = new FileSystemMock();
      const repository = new FileRepository('/test-dir', fileSystemMock);

      // Create a file first
      const content = new File([new TextEncoder().encode('test content')], 'test-file.txt');
      const filename = await repository.save(content);

      // Verify the file exists
      expect(fileSystemMock.fileExists(`/test-dir/${filename}`)).toBe(true);

      // when:
      await repository.remove(filename);

      // then:
      expect(fileSystemMock.fileExists(`/test-dir/${filename}`)).toBe(false);
    });

    it('should throw for other file system errors', async () => {
      // given:
      const fileSystemMock = new FileSystemMock();
      // Mock the unlink method to throw a non-ENOENT error
      fileSystemMock.unlink = async () => {
        throw new Error('Permission denied.');
      };

      const repository = new FileRepository('/test-dir', fileSystemMock);

      // when/then:
      await expect(repository.remove('some-file.txt')).rejects.toThrow('Permission denied');
    });
  });
});
