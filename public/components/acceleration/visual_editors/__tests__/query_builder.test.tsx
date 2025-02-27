/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  coveringIndexBuilderMock1,
  coveringIndexBuilderMock2,
  coveringIndexBuilderMockResult1,
  coveringIndexBuilderMockResult2,
  indexOptionsMock1,
  indexOptionsMock2,
  indexOptionsMock3,
  indexOptionsMockResult1,
  indexOptionsMockResult2,
  indexOptionsMockResult3,
  materializedViewBuilderMock1,
  materializedViewBuilderMock2,
  materializedViewBuilderMockResult1,
  materializedViewBuilderMockResult2,
  skippingIndexBuilderMock1,
  skippingIndexBuilderMock2,
  skippingIndexBuilderMockResult1,
  skippingIndexBuilderMockResult2,
} from '../../../../../test/mocks/accelerationMock';
import {
  buildIndexOptions,
  coveringIndexQueryBuilder,
  materializedQueryViewBuilder,
  skippingIndexQueryBuilder,
} from '../query_builder';

describe('buildIndexOptions', () => {
  it('should build index options with auto refresh', () => {
    const indexOptions = buildIndexOptions(indexOptionsMock1);
    expect(indexOptions).toEqual(indexOptionsMockResult1);
  });

  it('should build index options with interval refresh', () => {
    const indexOptions = buildIndexOptions(indexOptionsMock2);
    expect(indexOptions).toEqual(indexOptionsMockResult2);
  });

  it('should build index options with checkpoint location', () => {
    const indexOptions = buildIndexOptions(indexOptionsMock3);
    expect(indexOptions).toEqual(indexOptionsMockResult3);
  });

  describe('skippingIndexQueryBuilder', () => {
    it('should build skipping index query as expected with interval refresh', () => {
      const result = skippingIndexQueryBuilder(skippingIndexBuilderMock1);
      expect(result).toEqual(skippingIndexBuilderMockResult1);
    });

    it('should build skipping index query as expected with auto refresh', () => {
      const result = skippingIndexQueryBuilder(skippingIndexBuilderMock2);
      expect(result).toEqual(skippingIndexBuilderMockResult2);
    });
  });

  describe('coveringIndexQueryBuilder', () => {
    it('should build covering index query as expected with interval refresh', () => {
      const result = coveringIndexQueryBuilder(coveringIndexBuilderMock1);
      expect(result).toEqual(coveringIndexBuilderMockResult1);
    });

    it('should build covering index query as expected with auto refresh', () => {
      const result = coveringIndexQueryBuilder(coveringIndexBuilderMock2);
      expect(result).toEqual(coveringIndexBuilderMockResult2);
    });
  });

  describe('materializedQueryViewBuilder', () => {
    it('should build materialized view query as expected with interval refresh', () => {
      const result = materializedQueryViewBuilder(materializedViewBuilderMock1);
      expect(result).toEqual(materializedViewBuilderMockResult1);
    });

    it('should build materialized view query as expected with auto refresh', () => {
      const result = materializedQueryViewBuilder(materializedViewBuilderMock2);
      expect(result).toEqual(materializedViewBuilderMockResult2);
    });
  });
});
