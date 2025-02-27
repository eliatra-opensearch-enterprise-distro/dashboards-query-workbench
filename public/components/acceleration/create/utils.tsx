/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ACCELERATION_INDEX_NAME_REGEX,
  ACCELERATION_S3_URL_REGEX,
} from '../../../../common/constants';
import {
  AccelerationIndexType,
  CreateAccelerationForm,
  FormErrorsType,
  SkippingIndexRowType,
  materializedViewQueryType,
} from '../../../../common/types';

export const pluralizeTime = (timeWindow: number) => {
  return timeWindow > 1 ? 's' : '';
};

export const hasError = (formErrors: FormErrorsType, key?: keyof FormErrorsType) => {
  if (!key) return Object.values(formErrors).some((e) => !!e.length);
  return !!formErrors[key]?.length;
};

export const validateDataSource = (dataSource: string) => {
  return dataSource.trim().length === 0 ? ['Select a valid data source'] : [];
};

export const validateDatabase = (database: string) => {
  return database.trim().length === 0 ? ['Select a valid database'] : [];
};

export const validateDataTable = (dataTable: string) => {
  return dataTable.trim().length === 0 ? ['Select a valid table'] : [];
};

export const validatePrimaryShardCount = (primaryShardCount: number) => {
  return primaryShardCount < 1 ? ['Primary shards count should be greater than 0'] : [];
};

export const validateReplicaCount = (replicaCount: number) => {
  return replicaCount < 0 ? ['Replica count should be equal or greater than 0'] : [];
};

export const validateRefreshInterval = (refreshType: string, refreshWindow: number) => {
  return refreshType === 'interval' && refreshWindow < 1
    ? ['refresh window should be greater than 0']
    : [];
};

export const validateIndexName = (value: string) => {
  // Check if the value does not begin with underscores or hyphens and all characters are lower case
  return !ACCELERATION_INDEX_NAME_REGEX.test(value) ? ['Enter a valid index name'] : [];
};

export const validateCheckpointLocation = (
  accelerationIndexType: AccelerationIndexType,
  checkpointLocation: string | undefined
) => {
  if (accelerationIndexType === 'materialized' && !checkpointLocation) {
    return ['Checkpoint location is mandatory for materialized view creation'];
  }

  if (checkpointLocation && !ACCELERATION_S3_URL_REGEX.test(checkpointLocation))
    return ['Enter a valid checkpoint location'];

  return [];
};

export const validateSkippingIndexData = (
  accelerationIndexType: AccelerationIndexType,
  skippingIndexQueryData: SkippingIndexRowType[]
) => {
  // TODO: Validate dataType match with supported acceleration method type
  if (accelerationIndexType !== 'skipping') return [];

  if (skippingIndexQueryData.length < 1) return ['Add fields to the skipping index definition'];

  return [];
};

export const validateCoveringIndexData = (
  accelerationIndexType: AccelerationIndexType,
  coveringIndexQueryData: string[]
) => {
  if (accelerationIndexType !== 'covering') return [];

  if (coveringIndexQueryData.length < 1) return ['Add fields to covering index definition'];
  return [];
};

export const validateMaterializedViewData = (
  accelerationIndexType: AccelerationIndexType,
  materializedViewQueryData: materializedViewQueryType
) => {
  if (accelerationIndexType !== 'materialized') return [];

  if (materializedViewQueryData.columnsValues.length < 1)
    return ['Add columns to materialized view definition'];

  if (materializedViewQueryData.groupByTumbleValue.timeField === '')
    return ['Add a time field to tumble function in materialized view definition'];

  if (materializedViewQueryData.groupByTumbleValue.tumbleWindow < 1)
    return ['Add a valid time window to tumble function in materialized view definition'];
  return [];
};

export const formValidator = (accelerationformData: CreateAccelerationForm) => {
  const {
    dataSource,
    database,
    dataTable,
    accelerationIndexType,
    skippingIndexQueryData,
    coveringIndexQueryData,
    materializedViewQueryData,
    accelerationIndexName,
    primaryShardsCount,
    replicaShardsCount,
    refreshType,
    checkpointLocation,
    refreshIntervalOptions,
  } = accelerationformData;

  const accelerationFormErrors = {
    dataSourceError: validateDataSource(dataSource),
    databaseError: validateDatabase(database),
    dataTableError: validateDataTable(dataTable),
    primaryShardsError: validatePrimaryShardCount(primaryShardsCount),
    replicaShardsError: validateReplicaCount(replicaShardsCount),
    refreshIntervalError: validateRefreshInterval(
      refreshType,
      refreshIntervalOptions.refreshWindow
    ),
    checkpointLocationError: validateCheckpointLocation(accelerationIndexType, checkpointLocation),
    indexNameError: validateIndexName(accelerationIndexName),
    skippingIndexError: validateSkippingIndexData(accelerationIndexType, skippingIndexQueryData),
    coveringIndexError: validateCoveringIndexData(accelerationIndexType, coveringIndexQueryData),
    materializedViewError: validateMaterializedViewData(
      accelerationIndexType,
      materializedViewQueryData
    ),
  };

  return accelerationFormErrors;
};
