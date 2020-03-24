# ------------------------------------------------------- #
#### Libraries ####
# ------------------------------------------------------- #
library(shiny)
library(igraph)
library(rsconnect)
library(shinythemes)
library(ggplot2)

source('./covidwatch-model.R')

ui = fluidPage(
  theme = shinytheme("slate"),
  mainPanel(
    fluidRow(
      align = "center",
      titlePanel("Infection Spread With and Without Peer to Peer Contact Tracing")
    ),
    fluidRow(
      align = "center",
      checkboxInput("toggleIntervention", "Use Peer to Peer Contact Tracing", value = initialConfig$toggleIntervention),
      selectInput("nTrials", "# of Simulations", 2:initialConfig$maxNTrials, selected = initialConfig$nTrials)
    ),
    fluidRow(
      column(
        3,
        sliderInput("initialInfected", h3("Initial Infected Proportion"), min = 0, max = 1, value = initialConfig$initialInfected),
        sliderInput("isolationCompliance", h3("Isolation Compliance"), min = 0, max = 1, value = initialConfig$isolationCompliance)
      ),
      column(
        3,
        sliderInput("activeTime", h3("Infectious Period"), min = 0, max = 20, value = initialConfig$activeTime),
        sliderInput("assumedTimeFromInfect", h3("Estimated Discovery Time"), min = 0, max = 20, value = initialConfig$assumedTimeFromInfect)
      ),
      column(
        3,
        sliderInput("infectionProb", h3("Transmission Rate"), min = 0, max = 1, value = initialConfig$infectionProb),
        sliderInput("interventionUsage", h3("Adoption Rate"), min = 0, max = 1, value = initialConfig$interventionUsage)
      ),
      column(
        3,
        sliderInput("probDiscoverInfection", h3("Discovery Rate"), min = 0, max = 1, value = initialConfig$probDiscoverInfection)
      )
    ),
    fluidRow(
      align = "center",
      column(
        6,
        verbatimTextOutput("percentInfectedMean")
        # actionButton("refresh", "Run Again with the Same Parameters", style="margin:10px 0")
      ),
      column(
        6,
        verbatimTextOutput("percentInfectedCurrent"),
        uiOutput('selectSim')
      )
    ),
    fluidRow(
      align = "center",
      column(
        6,
        plotOutput('plot2')
      ),
      column(
        6,
        plotOutput('plot1')
      )
    ),
    width = 12
  )
)

server = function(input, output) {
  values <- reactiveValues(currentSim = 1, toggleDummy = F)
  observeEvent(input$currentSim, {
    values$currentSim <- as.numeric(input$currentSim)
  })
  observeEvent(input$refresh, {
    values$toggleDummy <- !values$toggleDummy
  })
  modelOut = reactive(modelFn(input, values$toggleDummy))
  simulationResults = reactive(modelOut()$simulationResults)
  infectionCurve = reactive(modelOut()$infectionCurve)
  currentResult = reactive(simulationResults()[[values$currentSim]])
  output$plot1 <- renderPlot({
    return(list(
      plot=plot(
        currentResult()$exposureNetwork,
        layout=function(g) { return(layout_on_grid(g, width=currentResult()$nPlaces)) },
        vertex.color=ifelse(
          currentResult()$exposeEvents,
          '#e37d7d',
          '#86bdfc'
        ),
        vertex.size=rep(sqrt(currentResult()$placePopularities * 100), currentResult()$totalTime),
        vertex.label=NA,
        edge.width=0.5,
        edge.arrow.size=0.5,
        edge.color=ifelse(
          currentResult()$infectedMovements,
          '#cf1111',
          '#076adb'
        ),
        label.font=2
      ),
      infected=currentResult()$infected,
      nTrials=currentResult()$nTrials
    ))
  })
  output$plot2 = renderPlot({
    ggplot(infectionCurve(), aes(x=time, y=active, group=factor(trial))) +
      geom_line(color='#cf1111') +
      ylim(0,1) +
      labs(title="Active Infections Over Time",x="Time", y = "Proportion of population with active infection")
  })
  output$percentInfectedMean <- renderText(
    {paste(
      'Average of ',
      currentResult()$nTrials,
      ' Simulations: ',
      paste(round(mean(sapply(simulationResults(), function(l) l$infected)) * 100), '%', sep=''),
      ' Infected',
      sep=''
    )}
  )
  output$percentInfectedCurrent <- renderText(
    {paste(
      'Selected Simulation: ',
      round(currentResult()$infected * 100),
      '% Infected',
      sep=''
    )}
  )
  output$selectSim = renderUI({
    selectInput("currentSim", "Show Simulation #", 1:currentResult()$nTrials, selected = values$currentSim)
  })
}

shinyApp(ui, server)