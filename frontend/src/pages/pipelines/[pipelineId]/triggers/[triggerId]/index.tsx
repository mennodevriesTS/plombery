import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Card,
  Title,
  Subtitle,
  Text,
  Bold,
  ListItem,
  Button,
  Flex,
  Icon,
  Grid,
} from '@tremor/react'
import { PlayIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import { useParams } from 'react-router-dom'
import React from 'react'

import TriggerParamsDialog from '@/components/TriggerParamsDialog'
import CopyButton from '@/components/CopyButton'
import Breadcrumbs from '@/components/Breadcrumbs'
import ManualRunDialog from '@/components/ManualRunDialog'
import PageLayout from '@/components/PageLayout'
import RunsDurationChart from '@/components/RunsDurationChart'
import RunsList from '@/components/RunsList'
import RunsStatusChart from '@/components/RunsStatusChart'
import { MANUAL_TRIGGER } from '@/constants'
import {
  getPipeline,
  listRuns,
  getTriggerRunUrl,
  runPipelineTrigger,
} from '@/repository'
import { formatDateTime } from '@/utils'
import { Trigger } from '@/types'

const TriggerView: React.FC = () => {
  const urlParams = useParams()
  const pipelineId = urlParams.pipelineId as string
  const triggerId = urlParams.triggerId as string

  const pipelineQuery = useQuery({
    queryKey: ['pipeline', pipelineId],
    queryFn: () => getPipeline(pipelineId),
    initialData: { id: '', name: '', description: '', tasks: [], triggers: [] },
    enabled: !!pipelineId,
  })

  const runsQuery = useQuery({
    queryKey: ['runs', triggerId, pipelineId],
    queryFn: () => listRuns(pipelineId, triggerId),
    initialData: [],
    enabled: !!triggerId,
  })

  const runPipelineMutation = useMutation({
    mutationFn: () => runPipelineTrigger(pipelineId, triggerId),
  })

  if (runsQuery.isLoading || pipelineQuery.isLoading)
    return <div>Loading...</div>

  if (runsQuery.error || pipelineQuery.error)
    return <div>An error has occurred</div>

  const pipeline = pipelineQuery.data

  const isManualTrigger = triggerId === MANUAL_TRIGGER.id
  const trigger: Trigger | undefined = !isManualTrigger
    ? pipeline.triggers.find((trigger) => trigger.id === triggerId)
    : MANUAL_TRIGGER

  if (!trigger) {
    return <div>Trigger not found</div>
  }

  const runTriggerButton = isManualTrigger ? (
    <ManualRunDialog pipeline={pipeline} />
  ) : (
    <Button
      size="xs"
      color="indigo"
      icon={PlayIcon}
      onClick={() => {
        runPipelineMutation.mutateAsync()
      }}
    >
      Run trigger
    </Button>
  )

  return (
    <PageLayout
      header={
        <Flex className="items-start">
          <div>
            <Title>Trigger {trigger.name}</Title>
            <Breadcrumbs pipeline={pipeline} trigger={trigger} />
          </div>

          {runTriggerButton}
        </Flex>
      }
    >
      <Grid numColsMd={2} numColsLg={3} className="gap-6 mt-6">
        <Card className="flex flex-col h-full">
          <Title>{trigger.name}</Title>
          <Subtitle>{trigger.description}</Subtitle>

          <div style={{ flexGrow: 1 }} />

          <ListItem>
            <Text>Schedule</Text>
            <Text>
              <Bold>{trigger.interval}</Bold>
            </Text>
          </ListItem>

          <ListItem>
            <Text>Next run</Text>
            <Text>
              <Bold>
                {trigger.next_fire_time
                  ? formatDateTime(trigger.next_fire_time)
                  : '-'}
              </Bold>
            </Text>
          </ListItem>

          <ListItem>
            <Text>Params</Text>
            {trigger.params ? (
              <TriggerParamsDialog trigger={trigger} />
            ) : (
              <Text>
                <em>No params</em>
              </Text>
            )}
          </ListItem>

          <ListItem>
            <Flex className="justify-start">
              <Text>Run URL</Text>

              <Icon
                size="sm"
                color="slate"
                icon={QuestionMarkCircleIcon}
                tooltip="URL to run the trigger programmatically via an HTTP POST request"
              />
            </Flex>

            <Flex className="justify-end">
              <div
                className="bg-slate-100 border-slate-300 rounded border text-slate-500 text-xs truncate px-1 py-0.5 mr-2"
                style={{ maxWidth: 200 }}
                title={getTriggerRunUrl(pipelineId, triggerId)}
              >
                {getTriggerRunUrl(pipelineId, triggerId)}
              </div>

              <CopyButton content={getTriggerRunUrl(pipelineId, triggerId)} />
            </Flex>
          </ListItem>
        </Card>

        <RunsStatusChart
          subject="Trigger"
          runs={[...runsQuery.data].reverse()}
        />

        <RunsDurationChart runs={runsQuery.data} />
      </Grid>

      <div className="mt-6">
        <RunsList
          runs={runsQuery.data}
          pipelineId={pipelineId}
          triggerId={triggerId}
        />
      </div>
    </PageLayout>
  )
}

export default TriggerView
