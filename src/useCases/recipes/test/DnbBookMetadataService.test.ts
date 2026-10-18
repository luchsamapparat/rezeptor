import { describe, expect, it, vi } from 'vitest';
import { ExternalServiceError, ValidationError } from '../../../common/server/error';
import { loggerMock } from '../../../tests/mocks/logger.mock';
import { DnbBookMetadataService } from '../infrastructure/DnbBookMetadataService';

describe('DnbBookMetadataService', () => {
  it('should map the first DNB MARC21 record to book metadata', async () => {
    // given:
    const responseXml = `
      <searchRetrieveResponse xmlns="http://www.loc.gov/zing/srw/">
        <numberOfRecords>1</numberOfRecords>
        <records>
          <record>
            <recordData>
              <record xmlns="http://www.loc.gov/MARC21/slim">
                <datafield tag="020">
                  <subfield code="a">9783831047635</subfield>
                </datafield>
                <datafield tag="020">
                  <subfield code="a">3831047634</subfield>
                </datafield>
                <datafield tag="100">
                  <subfield code="a">Müller, Maria</subfield>
                  <subfield code="4">aut</subfield>
                </datafield>
                <datafield tag="245">
                  <subfield code="a">Meine Rezepte</subfield>
                  <subfield code="b">Einfach kochen</subfield>
                </datafield>
                <datafield tag="700">
                  <subfield code="a">Mustermann, Erika</subfield>
                  <subfield code="4">aut</subfield>
                </datafield>
                <datafield tag="700">
                  <subfield code="a">Beispiel, Bernd</subfield>
                  <subfield code="4">trl</subfield>
                </datafield>
              </record>
            </recordData>
          </record>
        </records>
      </searchRetrieveResponse>
    `;
    const httpClient = vi.fn().mockResolvedValue(new Response(responseXml, { status: 200 }));
    const service = new DnbBookMetadataService(httpClient, loggerMock);

    // when:
    const book = await service.findBook('978-3-8310-4763-5');

    // then:
    expect(book).toEqual({
      title: 'Meine Rezepte: Einfach kochen',
      authors: ['Müller, Maria', 'Mustermann, Erika'],
      isbn10: '3831047634',
      isbn13: '9783831047635',
    });

    const [requestUrl, requestInit] = httpClient.mock.calls[0] as [URL, RequestInit];
    expect(requestUrl.origin + requestUrl.pathname).toBe('https://services.dnb.de/sru/dnb');
    expect(requestUrl.searchParams.get('query')).toBe('isbn=9783831047635');
    expect(requestUrl.searchParams.get('recordSchema')).toBe('MARC21-xml');
    expect(requestUrl.searchParams.get('maximumRecords')).toBe('1');
    expect(requestInit).toEqual({ headers: { Accept: 'application/xml' } });
  });

  it('should return null when DNB has no matching record', async () => {
    // given:
    const httpClient = vi.fn().mockResolvedValue(new Response(`
      <searchRetrieveResponse xmlns="http://www.loc.gov/zing/srw/">
        <numberOfRecords>0</numberOfRecords>
      </searchRetrieveResponse>
    `, { status: 200 }));
    const service = new DnbBookMetadataService(httpClient, loggerMock);

    // when:
    const book = await service.findBook('9783831047635');

    // then:
    expect(book).toBeNull();
  });

  it('should return null when the matching record has no title', async () => {
    // given:
    const httpClient = vi.fn().mockResolvedValue(new Response(`
      <searchRetrieveResponse xmlns="http://www.loc.gov/zing/srw/">
        <numberOfRecords>1</numberOfRecords>
        <records><record><recordData><record xmlns="http://www.loc.gov/MARC21/slim">
          <datafield tag="020"><subfield code="a">9783831047635</subfield></datafield>
        </record></recordData></record></records>
      </searchRetrieveResponse>
    `, { status: 200 }));
    const service = new DnbBookMetadataService(httpClient, loggerMock);

    // when:
    const book = await service.findBook('9783831047635');

    // then:
    expect(book).toBeNull();
  });

  it('should reject an empty ISBN without calling DNB', async () => {
    // given:
    const httpClient = vi.fn();
    const service = new DnbBookMetadataService(httpClient, loggerMock);

    // when/then:
    await expect(service.findBook('---')).rejects.toThrow(ValidationError);
    expect(httpClient).not.toHaveBeenCalled();
  });

  it('should wrap failed DNB responses as external service errors', async () => {
    // given:
    const httpClient = vi.fn().mockResolvedValue(new Response(null, { status: 503 }));
    const service = new DnbBookMetadataService(httpClient, loggerMock);

    // when/then:
    await expect(service.findBook('9783831047635')).rejects.toThrow(ExternalServiceError);
  });

  it('should wrap malformed DNB responses as external service errors', async () => {
    // given:
    const httpClient = vi.fn().mockResolvedValue(new Response('<unexpected-response/>', { status: 200 }));
    const service = new DnbBookMetadataService(httpClient, loggerMock);

    // when/then:
    await expect(service.findBook('9783831047635')).rejects.toThrow(ExternalServiceError);
  });
});
