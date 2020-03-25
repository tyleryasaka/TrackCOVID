library(ggplot2)
# source('./covidwatch-model.R')

figure1file = "./output/infection-curve-1.tiff"
figure2file = "./output/infection-curve-2.tiff"

config.default = list(
  nTrials = 10,
  maxNTrials = 20,
  toggleIntervention = F,
  
  # model config
  nPlaces = 6,
  nPeople = 40,
  totalTime = 20,
  initialInfected = 0.05,
  activeTime = 8,
  infectionProb = 0.25,
  diagnosisPeriod = 2,
  isolationCompliance = 1,
  
  # intervention config
  estimatedDiagnosisPeriod = 2,
  estimatedActiveTime = 8,
  interventionUsage = 0.5
)

config.intervention.25 = config.default
config.intervention.25$toggleIntervention = T
config.intervention.25$interventionUsage = 0.25

config.intervention.50 = config.default
config.intervention.50$toggleIntervention = T
config.intervention.50$interventionUsage = 0.5

config.intervention.75 = config.default
config.intervention.75$toggleIntervention = T
config.intervention.75$interventionUsage = 0.75

curve.default = modelFn(config.default)$infectionCurve
curve.intervention.25 = modelFn(config.intervention.25)$infectionCurve
curve.intervention.50 = modelFn(config.intervention.50)$infectionCurve
curve.intervention.75 = modelFn(config.intervention.75)$infectionCurve
curve.intervention.25.participate = modelFn(config.intervention.25)$infectionCurveParticipate
curve.intervention.25.abstain = modelFn(config.intervention.25)$infectionCurveAbstain

# ------------------------------------------------------- #
#### Figure 1 ####
# ------------------------------------------------------- #
curve.default$scenario = 'None'
curve.intervention.25$scenario = '25%'
curve.intervention.50$scenario = '50%'
curve.intervention.75$scenario = '75%'

curve.default$group = paste(curve.default$trial, curve.default$scenario)
curve.intervention.25$group = paste(curve.intervention.25$trial, curve.intervention.25$scenario)
curve.intervention.50$group = paste(curve.intervention.50$trial, curve.intervention.50$scenario)
curve.intervention.75$group = paste(curve.intervention.75$trial, curve.intervention.75$scenario)

curve.combined = rbind(
  curve.default,
  curve.intervention.25,
  curve.intervention.50,
  curve.intervention.75
)
scenarios = c('None', '25%', '50%', '75%')

tiff(figure1file, units="in", width=5, height=3, res=300)
ggplot(curve.combined, aes(x=time, y=active, group=factor(group), color=factor(scenario, scenarios))) +
  geom_line() +
  scale_colour_manual(values=c('#EF476F', '#FFD166', '#06D6A0', '#118AB2')) +
  ylim(0,1) +
  labs(x="Time",
       y="Proportion of population infected",
       color="Adoption rate")
  # theme(axis.title=element_text(size=8))
dev.off()

# ------------------------------------------------------- #
#### Figure 2 ####
# ------------------------------------------------------- #
curve.intervention.25.participate$scenario = 'Adopted'
curve.intervention.25.abstain$scenario = 'Did not adopt'

curve.intervention.25.participate$group = paste(curve.intervention.25.participate$trial, curve.intervention.25.participate$scenario)
curve.intervention.25.abstain$group = paste(curve.intervention.25.abstain$trial, curve.intervention.25.abstain$scenario)

curve.combined = rbind(
  curve.intervention.25.participate,
  curve.intervention.25.abstain
)
scenarios = c('Adopted', 'Did not adopt')

tiff(figure2file, units="in", width=5, height=3.5, res=300)
ggplot(curve.combined, aes(x=time, y=active, group=factor(group), color=factor(scenario, scenarios))) +
  geom_line() +
  scale_colour_manual(values=c('#118AB2', '#EF476F')) +
  ylim(0,1) +
  labs(x="Time",
       y="Proportion of population with active infection",
       color="Cohort") +
  theme(axis.title=element_text(size=10))
dev.off()