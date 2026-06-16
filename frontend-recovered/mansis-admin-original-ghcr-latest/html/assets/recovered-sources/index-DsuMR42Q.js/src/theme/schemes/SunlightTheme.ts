import { alpha, createTheme, darken } from '@mui/material';
import '@mui/lab/themeAugmentation';
import type {} from '@mui/x-data-grid/themeAugmentation';

const themeColors = {
  primary: '#1976D2',
  secondary: '#666666',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  black: '#121212',
  white: '#FFFFFF',
  primaryAlt: '#F5F5F5',
  trueWhite: '#ffffff'
};

const colors = {
  gradients: {
    blue1: 'linear-gradient(135deg, #42A5F5 0%, #1976D2 100%)',
    blue2: 'linear-gradient(135deg, #E3F2FD 0%, #2196F3 100%)',
    blue3: 'linear-gradient(127.55deg, #FAFAFA 3.73%, #E0E0E0 92.26%)',
    blue4: 'linear-gradient(-20deg, #90CAF9 0%, #1976D2 100%)',
    blue5: 'linear-gradient(135deg, #BBDEFB 10%, #1565C0 100%)',
    orange1: 'linear-gradient(135deg, #FFE0B2 0%, #FF9800 100%)',
    orange2: 'linear-gradient(135deg, #FFF3E0 0%, #FB8C00 100%)',
    orange3: 'linear-gradient(120deg, #FFE082 0%, #FF8A65 100%)',
    purple1: 'linear-gradient(135deg, #E1BEE7 0%, #9C27B0 100%)',
    purple3: 'linear-gradient(135deg, #CE93D8 0%, #8E24AA 100%)',
    pink1: 'linear-gradient(135deg, #F8BBD9 0%, #E91E63 100%)',
    pink2: 'linear-gradient(135deg, #F48FB1 0%, #C2185B 100%)',
    green1: 'linear-gradient(135deg, #C8E6C9 0%, #4CAF50 100%)',
    green2: 'linear-gradient(to bottom, #81C784, #66BB6A)',
    black1: 'linear-gradient(100.66deg, #F5F5F5 6.56%, #E0E0E0 93.57%)',
    black2: 'linear-gradient(60deg, #FAFAFA 0%, #F0F0F0 100%)'
  },
  shadows: {
    success:
      '0px 1px 4px rgba(76, 175, 80, 0.25), 0px 3px 12px 2px rgba(76, 175, 80, 0.15)',
    error:
      '0px 1px 4px rgba(244, 67, 54, 0.25), 0px 3px 12px 2px rgba(244, 67, 54, 0.15)',
    info: '0px 1px 4px rgba(33, 150, 243, 0.25), 0px 3px 12px 2px rgba(33, 150, 243, 0.15)',
    primary:
      '0px 1px 4px rgba(25, 118, 210, 0.25), 0px 3px 12px 2px rgba(25, 118, 210, 0.15)',
    warning:
      '0px 1px 4px rgba(255, 152, 0, 0.25), 0px 3px 12px 2px rgba(255, 152, 0, 0.15)',
    card: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    cardSm: '0px 1px 4px rgba(0, 0, 0, 0.08)',
    cardLg:
      '0 0rem 14rem 0 rgb(0 0 0 / 5%), 0 0.8rem 2.3rem rgb(0 0 0 / 8%), 0 0.2rem 0.7rem rgb(0 0 0 / 12%)'
  },
  layout: {
    general: {
      bodyBg: '#FAFAFA'
    },
    sidebar: {
      background: themeColors.white,
      textColor: themeColors.black,
      dividerBg: '#E0E0E0',
      menuItemColor: '#666666',
      menuItemColorActive: themeColors.primary,
      menuItemBg: 'transparent',
      menuItemBgActive: alpha(themeColors.primary, 0.08),
      menuItemIconColor: '#757575',
      menuItemIconColorActive: themeColors.primary,
      menuItemHeadingColor: '#424242'
    }
  },
  alpha: {
    white: {
      5: alpha(themeColors.white, 0.02),
      10: alpha(themeColors.white, 0.1),
      30: alpha(themeColors.white, 0.3),
      50: alpha(themeColors.white, 0.5),
      70: alpha(themeColors.white, 0.7),
      100: themeColors.white
    },
    trueWhite: {
      5: alpha(themeColors.trueWhite, 0.02),
      10: alpha(themeColors.trueWhite, 0.1),
      30: alpha(themeColors.trueWhite, 0.3),
      50: alpha(themeColors.trueWhite, 0.5),
      70: alpha(themeColors.trueWhite, 0.7),
      100: themeColors.trueWhite
    },
    black: {
      5: alpha(themeColors.black, 0.02),
      10: alpha(themeColors.black, 0.1),
      30: alpha(themeColors.black, 0.3),
      50: alpha(themeColors.black, 0.5),
      70: alpha(themeColors.black, 0.7),
      100: themeColors.black
    }
  },
  secondary: {
    lighter: alpha(themeColors.secondary, 0.1),
    light: alpha(themeColors.secondary, 0.3),
    main: themeColors.secondary,
    dark: darken(themeColors.secondary, 0.2)
  },
  primary: {
    lighter: alpha(themeColors.primary, 0.1),
    light: alpha(themeColors.primary, 0.3),
    main: themeColors.primary,
    dark: darken(themeColors.primary, 0.2)
  },
  success: {
    lighter: alpha(themeColors.success, 0.1),
    light: alpha(themeColors.success, 0.3),
    main: themeColors.success,
    dark: darken(themeColors.success, 0.2)
  },
  warning: {
    lighter: alpha(themeColors.warning, 0.1),
    light: alpha(themeColors.warning, 0.3),
    main: themeColors.warning,
    dark: darken(themeColors.warning, 0.2)
  },
  error: {
    lighter: alpha(themeColors.error, 0.1),
    light: alpha(themeColors.error, 0.3),
    main: themeColors.error,
    dark: darken(themeColors.error, 0.2)
  },
  info: {
    lighter: alpha(themeColors.info, 0.1),
    light: alpha(themeColors.info, 0.3),
    main: themeColors.info,
    dark: darken(themeColors.info, 0.2)
  }
};

export const SunlightTheme = createTheme({
  direction: 'ltr',
  colors: {
    gradients: {
      blue1: colors.gradients.blue1,
      blue2: colors.gradients.blue2,
      blue3: colors.gradients.blue3,
      blue4: colors.gradients.blue4,
      blue5: colors.gradients.blue5,
      orange1: colors.gradients.orange1,
      orange2: colors.gradients.orange2,
      orange3: colors.gradients.orange3,
      purple1: colors.gradients.purple1,
      purple3: colors.gradients.purple3,
      pink1: colors.gradients.pink1,
      pink2: colors.gradients.pink2,
      green1: colors.gradients.green1,
      green2: colors.gradients.green2,
      black1: colors.gradients.black1,
      black2: colors.gradients.black2
    },
    shadows: {
      success: colors.shadows.success,
      error: colors.shadows.error,
      info: colors.shadows.info,
      primary: colors.shadows.primary,
      warning: colors.shadows.warning
    },
    alpha: {
      white: {
        5: alpha(themeColors.white, 0.02),
        10: alpha(themeColors.white, 0.1),
        30: alpha(themeColors.white, 0.3),
        50: alpha(themeColors.white, 0.5),
        70: alpha(themeColors.white, 0.7),
        100: themeColors.white
      },
      trueWhite: {
        5: alpha(themeColors.trueWhite, 0.02),
        10: alpha(themeColors.trueWhite, 0.1),
        30: alpha(themeColors.trueWhite, 0.3),
        50: alpha(themeColors.trueWhite, 0.5),
        70: alpha(themeColors.trueWhite, 0.7),
        100: themeColors.trueWhite
      },
      black: {
        5: alpha(themeColors.black, 0.02),
        10: alpha(themeColors.black, 0.1),
        30: alpha(themeColors.black, 0.3),
        50: alpha(themeColors.black, 0.5),
        70: alpha(themeColors.black, 0.7),
        100: themeColors.black
      }
    },
    secondary: {
      lighter: alpha(themeColors.secondary, 0.1),
      light: alpha(themeColors.secondary, 0.3),
      main: themeColors.secondary,
      dark: darken(themeColors.secondary, 0.2)
    },
    primary: {
      lighter: alpha(themeColors.primary, 0.1),
      light: alpha(themeColors.primary, 0.3),
      main: themeColors.primary,
      dark: darken(themeColors.primary, 0.2)
    },
    success: {
      lighter: alpha(themeColors.success, 0.1),
      light: alpha(themeColors.success, 0.3),
      main: themeColors.success,
      dark: darken(themeColors.success, 0.2)
    },
    warning: {
      lighter: alpha(themeColors.warning, 0.1),
      light: alpha(themeColors.warning, 0.3),
      main: themeColors.warning,
      dark: darken(themeColors.warning, 0.2)
    },
    error: {
      lighter: alpha(themeColors.error, 0.1),
      light: alpha(themeColors.error, 0.3),
      main: themeColors.error,
      dark: darken(themeColors.error, 0.2)
    },
    info: {
      lighter: alpha(themeColors.info, 0.1),
      light: alpha(themeColors.info, 0.3),
      main: themeColors.info,
      dark: darken(themeColors.info, 0.2)
    }
  },
  general: {
    reactFrameworkColor: themeColors.black,
    borderRadiusSm: '6px',
    borderRadius: '10px',
    borderRadiusLg: '12px',
    borderRadiusXl: '16px'
  },
  sidebar: {
    background: colors.layout.sidebar.background,
    textColor: colors.layout.sidebar.textColor,
    dividerBg: colors.layout.sidebar.dividerBg,
    menuItemColor: colors.layout.sidebar.menuItemColor,
    menuItemColorActive: colors.layout.sidebar.menuItemColorActive,
    menuItemBg: colors.layout.sidebar.menuItemBg,
    menuItemBgActive: colors.layout.sidebar.menuItemBgActive,
    menuItemIconColor: colors.layout.sidebar.menuItemIconColor,
    menuItemIconColorActive: colors.layout.sidebar.menuItemIconColorActive,
    menuItemHeadingColor: colors.layout.sidebar.menuItemHeadingColor,
    boxShadow: '1px 0 0 #E0E0E0',
    width: '290px'
  },
  header: {
    height: '7vh',
    background: themeColors.white,
    boxShadow: '0px 1px 0px' + '#E0E0E0',
    textColor: colors.secondary.main
  },
  spacing: 9,
  palette: {
    common: {
      black: themeColors.black,
      white: themeColors.white
    },
    mode: 'light',
    primary: {
      light: colors.primary.light,
      main: colors.primary.main,
      dark: colors.primary.dark
    },
    secondary: {
      light: colors.secondary.light,
      main: colors.secondary.main,
      dark: colors.secondary.dark
    },
    error: {
      light: colors.error.light,
      main: colors.error.main,
      dark: colors.error.dark,
      contrastText: themeColors.white
    },
    success: {
      light: colors.success.light,
      main: colors.success.main,
      dark: colors.success.dark,
      contrastText: themeColors.white
    },
    info: {
      light: colors.info.light,
      main: colors.info.main,
      dark: colors.info.dark,
      contrastText: themeColors.white
    },
    warning: {
      light: colors.warning.light,
      main: colors.warning.main,
      dark: colors.warning.dark,
      contrastText: themeColors.white
    },
    text: {
      primary: themeColors.black,
      secondary: darken(themeColors.black, 0.4),
      disabled: darken(themeColors.black, 0.6)
    },
    background: {
      paper: themeColors.white,
      default: colors.layout.general.bodyBg
    },
    action: {
      active: themeColors.black,
      hover: alpha(themeColors.black, 0.04),
      hoverOpacity: 0.04,
      selected: alpha(themeColors.black, 0.08),
      selectedOpacity: 0.08,
      disabled: alpha(themeColors.black, 0.26),
      disabledBackground: alpha(themeColors.black, 0.12),
      disabledOpacity: 0.38,
      focus: alpha(themeColors.black, 0.12),
      focusOpacity: 0.12,
      activatedOpacity: 0.12
    },
    divider: alpha(themeColors.black, 0.12)
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1840
    }
  },
  components: {
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(themeColors.black, 0.4),
          backdropFilter: 'blur(2px)',

          '&:not(.MuiBackdrop-invisible)': {
            backgroundColor: alpha(themeColors.black, 0.4),
            backdropFilter: 'blur(2px)'
          }
        }
      }
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          marginLeft: 8,
          marginRight: 8,
          fontWeight: 'bold'
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: themeColors.white
        }
      }
    },
    MuiCssBaseline: {
      styleOverrides: {
        'html, body': {
          width: '100%',
          height: '100%'
        },
        body: {
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%',
          width: '100%',
          flex: 1
        },
        '#__next': {
          width: '100%',
          display: 'flex',
          flex: 1,
          flexDirection: 'column'
        },
        html: {
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%',
          width: '100%',
          MozOsxFontSmoothing: 'grayscale',
          WebkitFontSmoothing: 'antialiased'
        },
        '.child-popover .MuiPaper-root .MuiList-root': {
          flexDirection: 'column'
        },
        '#nprogress': {
          pointerEvents: 'none'
        },
        '#nprogress .bar': {
          background: colors.primary.main
        },
        '#nprogress .spinner-icon': {
          borderTopColor: colors.primary.main,
          borderLeftColor: colors.primary.main
        },
        '#nprogress .peg': {
          boxShadow:
            '0 0 15px ' +
            colors.primary.main +
            ', 0 0 8px' +
            colors.primary.main
        },
        ':root': {
          '--swiper-theme-color': colors.primary.main,
          colorScheme: 'light'
        },
        code: {
          background: colors.info.lighter,
          color: colors.info.dark,
          borderRadius: 4,
          padding: 4
        },
        '@keyframes pulse': {
          '0%': {
            transform: 'scale(.75)'
          },
          '20%': {
            transform: 'scale(1.1)'
          },
          '40%': {
            transform: 'scale(.75)'
          },
          '60%': {
            transform: 'scale(1.05)'
          },
          '80%': {
            transform: 'scale(.75)'
          },
          '100%': {
            transform: 'scale(.75)'
          }
        },
        '@keyframes ripple': {
          '0%': {
            transform: 'scale(.8)',
            opacity: 1
          },
          '100%': {
            transform: 'scale(2.8)',
            opacity: 0
          }
        },
        '@keyframes float': {
          '0%': {
            transform: 'translate(0%, 0%)'
          },
          '100%': {
            transform: 'translate(3%, 3%)'
          }
        }
      }
    },
    MuiSelect: {
      styleOverrides: {
        iconOutlined: {
          color: alpha(themeColors.black, 0.5)
        },
        icon: {
          top: 'calc(50% - 14px)'
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiInputAdornment-positionEnd.MuiInputAdornment-outlined': {
            paddingRight: 6
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(themeColors.black, 0.5)
          },
          '&.Mui-focused:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.primary.main
          }
        }
      }
    },
    MuiListSubheader: {
      styleOverrides: {
        colorPrimary: {
          fontWeight: 'bold',
          lineHeight: '40px',
          fontSize: 13,
          background: alpha(themeColors.black, 0.05),
          color: alpha(themeColors.black, 0.7)
        }
      }
    },
    MuiCardHeader: {
      styleOverrides: {
        action: {
          marginTop: -5,
          marginBottom: -5
        },
        title: {
          fontSize: 15
        }
      }
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          borderRadius: '50px'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        colorSecondary: {
          background: colors.alpha.black[5],
          color: colors.alpha.black[100],

          '&:hover': {
            background: colors.alpha.black[10]
          }
        },
        deleteIcon: {
          color: colors.error.light,

          '&:hover': {
            color: colors.error.main
          }
        }
      }
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          boxShadow: 'none',

          '&.Mui-expanded': {
            margin: 0
          },
          '&::before': {
            display: 'none'
          }
        }
      }
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontSize: 14,
          fontWeight: 'bold'
        },
        colorDefault: {
          background: colors.alpha.black[30],
          color: themeColors.black
        }
      }
    },
    MuiAvatarGroup: {
      styleOverrides: {
        root: {
          alignItems: 'center'
        },
        avatar: {
          background: colors.alpha.black[10],
          fontSize: 13,
          color: colors.alpha.black[70],
          fontWeight: 'bold',

          '&:first-of-type': {
            border: 0,
            background: 'transparent'
          }
        }
      }
    },
    MuiListItemAvatar: {
      styleOverrides: {
        alignItemsFlexStart: {
          marginTop: 0
        }
      }
    },
    MuiPaginationItem: {
      styleOverrides: {
        page: {
          fontSize: 13,
          fontWeight: 'bold',
          transition: 'all .2s'
        },
        textPrimary: {
          '&.Mui-selected': {
            boxShadow: colors.shadows.primary
          },
          '&.MuiButtonBase-root:hover': {
            backgroundColor: colors.alpha.black[5]
          },
          '&.Mui-selected.MuiButtonBase-root:hover': {
            backgroundColor: colors.primary.main
          }
        }
      }
    },
    MuiButton: {
      defaultProps: {
        disableRipple: false
      },
      styleOverrides: {
        root: {
          fontWeight: 'bold',
          textTransform: 'none',
          paddingLeft: 16,
          paddingRight: 16,

          '.MuiSvgIcon-root': {
            transition: 'all .2s'
          }
        },
        endIcon: {
          marginRight: -8
        },
        containedInherit: {
          backgroundColor: colors.alpha.black[5],
          color: colors.alpha.black[100],

          '&:hover': {
            backgroundColor: colors.alpha.black[10]
          }
        },
        outlined: {
          '&:hover': {
            backgroundColor: colors.alpha.black[5]
          }
        },
        outlinedPrimary: {
          '&:hover': {
            backgroundColor: alpha(colors.primary.main, 0.08),
            color: colors.primary.main
          }
        },
        outlinedSecondary: {
          '&:hover': {
            backgroundColor: colors.alpha.black[5]
          }
        }
      }
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: false
      },
      styleOverrides: {
        root: {
          borderRadius: 6
        }
      }
    },
    MuiToggleButton: {
      defaultProps: {
        disableRipple: false
      },
      styleOverrides: {
        root: {
          color: colors.primary.main,
          background: alpha(themeColors.black, 0.05),
          transition: 'all .2s',

          '&:hover': {
            backgroundColor: alpha(themeColors.black, 0.1),
            color: themeColors.black
          },
          '&.Mui-selected': {
            backgroundColor: colors.primary.lighter,
            color: themeColors.black,

            '&:hover': {
              backgroundColor: alpha(colors.primary.main, 0.15),
              color: themeColors.black
            }
          }
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: 10,

          '& .MuiTouchRipple-root': {
            borderRadius: 6
          }
        },
        sizeSmall: {
          padding: 4
        }
      }
    },
    MuiListItemSecondaryAction: {
      styleOverrides: {
        root: {
          right: 16
        }
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '& .MuiTouchRipple-root': {
            opacity: 0.3
          }
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          background: colors.alpha.black[10],
          border: 0,
          height: 1
        },
        vertical: {
          height: 'auto',
          width: 1,

          '&.MuiDivider-flexItem.MuiDivider-fullWidth': {
            height: 'auto',
            width: 1
          }
        },
        withChildren: {
          '&:before, &:after': {
            border: 0
          }
        },
        wrapper: {
          background: colors.layout.general.bodyBg,
          fontWeight: 'bold',
          height: 24,
          lineHeight: '24px',
          marginTop: -12,
          color: 'inherit',
          textTransform: 'uppercase'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: themeColors.white
        },
        elevation0: {
          boxShadow: 'none'
        },
        elevation1: {
          boxShadow: colors.shadows.card
        },
        elevation2: {
          boxShadow: colors.shadows.cardSm
        },
        elevation24: {
          boxShadow: colors.shadows.cardLg
        },
        outlined: {
          boxShadow: colors.shadows.card
        }
      }
    },
    MuiLink: {
      defaultProps: {
        underline: 'hover'
      }
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          height: 6
        },
        bar: {
          borderRadius: 6
        }
      }
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          '& .MuiSlider-valueLabelCircle, .MuiSlider-valueLabelLabel': {
            transform: 'none'
          },
          '& .MuiSlider-valueLabelCircle': {
            borderRadius: 6,
            height: 24,
            width: 'auto',
            paddingLeft: 8,
            paddingRight: 8
          },
          '& .MuiSlider-rail': {
            opacity: 0.4
          }
        }
      }
    },
    MuiList: {
      styleOverrides: {
        root: {
          padding: 0,

          '& .MuiListItem-button': {
            transition: 'all .2s',

            '& > .MuiSvgIcon-root': {
              minWidth: 34
            },

            '& .MuiTouchRipple-root': {
              opacity: 0.2
            }
          },
          '& .MuiListItem-root.MuiButtonBase-root.Mui-selected': {
            backgroundColor: alpha(themeColors.black, 0.1)
          },
          '& .MuiMenuItem-root.MuiButtonBase-root:active': {
            backgroundColor: alpha(themeColors.black, 0.15)
          },
          '& .MuiMenuItem-root.MuiButtonBase-root .MuiTouchRipple-root': {
            opacity: 0.2
          }
        },
        padding: {
          padding: '12px',

          '& .MuiListItem-button': {
            borderRadius: 6,
            margin: '1px 0'
          }
        }
      }
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          height: 38,
          minHeight: 38,
          overflow: 'visible'
        },
        indicator: {
          height: 38,
          minHeight: 38,
          borderRadius: 6,
          border: '1px solid ' + colors.primary.dark,
          boxShadow: '0px 2px 10px ' + colors.primary.light
        },
        scrollableX: {
          overflow: 'visible !important'
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          padding: 0,
          height: 38,
          minHeight: 38,
          borderRadius: 6,
          transition: 'color .2s',
          textTransform: 'capitalize',

          '&.MuiButtonBase-root': {
            minWidth: 'auto',
            paddingLeft: 20,
            paddingRight: 20,
            marginRight: 4
          },
          '&.Mui-selected, &.Mui-selected:hover': {
            color: colors.alpha.white[100],
            zIndex: 5
          },
          '&:hover': {
            color: colors.alpha.black[100]
          }
        }
      }
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          padding: 12
        },
        list: {
          padding: 12,

          '& .MuiMenuItem-root.MuiButtonBase-root': {
            fontSize: 14,
            marginTop: 1,
            marginBottom: 1,
            transition: 'all .2s',
            color: alpha(themeColors.black, 0.7),

            '& .MuiTouchRipple-root': {
              opacity: 0.2
            },

            '&:hover, &:active, &.active, &.Mui-selected': {
              color: themeColors.black,
              background: alpha(colors.primary.lighter, 0.2)
            }
          }
        }
      }
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          background: 'transparent',
          transition: 'all .2s',

          '&:hover, &:active, &.active, &.Mui-selected': {
            color: themeColors.black,
            background: alpha(colors.primary.lighter, 0.2)
          },
          '&.Mui-selected:hover': {
            background: alpha(colors.primary.lighter, 0.2)
          }
        }
      }
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          '&.MuiButtonBase-root': {
            color: colors.secondary.main,

            '&:hover, &:active, &.active, &.Mui-selected': {
              color: themeColors.black,
              background: alpha(colors.primary.lighter, 0.2)
            }
          }
        }
      }
    },
    MuiAutocomplete: {
      styleOverrides: {
        tag: {
          margin: 1
        },
        root: {
          '& .MuiAutocomplete-inputRoot.MuiOutlinedInput-root .MuiAutocomplete-endAdornment':
            {
              right: 6
            }
        },
        clearIndicator: {
          background: colors.error.lighter,
          color: colors.error.main,
          marginRight: 8,

          '&:hover': {
            background: colors.error.lighter,
            color: colors.error.dark
          }
        },
        popupIndicator: {
          color: colors.alpha.black[50],

          '&:hover': {
            background: colors.primary.lighter,
            color: colors.primary.main
          }
        }
      }
    },
    MuiTablePagination: {
      styleOverrides: {
        toolbar: {
          '& .MuiIconButton-root': {
            padding: 8
          }
        },
        select: {
          '&:focus': {
            backgroundColor: 'transparent'
          }
        }
      }
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '0 !important',
          padding: '0 !important'
        }
      }
    },
    MuiTableRow: {
      styleOverrides: {
        head: {
          background: alpha(themeColors.black, 0.05)
        },
        root: {
          transition: 'background-color .2s',

          '&.MuiTableRow-hover:hover': {
            backgroundColor: alpha(themeColors.black, 0.05)
          }
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: alpha(themeColors.black, 0.1),
          fontSize: 14
        },
        head: {
          textTransform: 'uppercase',
          fontSize: 13,
          fontWeight: 'bold',
          color: alpha(themeColors.black, 0.7)
        }
      }
    },
    MuiAlert: {
      styleOverrides: {
        message: {
          lineHeight: 1.5,
          fontSize: 14
        },
        standardWarning: {
          color: colors.warning.dark
        },
        action: {
          color: alpha(themeColors.black, 0.7)
        }
      }
    },
    MuiTimelineDot: {
      styleOverrides: {
        root: {
          margin: 0,
          zIndex: 5,
          position: 'absolute',
          top: '50%',
          marginTop: -6,
          left: -6
        },
        outlined: {
          backgroundColor: themeColors.white,
          boxShadow: '0 0 0 6px ' + themeColors.white
        },
        outlinedPrimary: {
          backgroundColor: themeColors.white,
          boxShadow: '0 0 0 6px ' + themeColors.white
        }
      }
    },
    MuiTimelineConnector: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(themeColors.black, 0.1)
        }
      }
    },
    MuiTimelineItem: {
      styleOverrides: {
        root: {
          minHeight: 0,
          padding: '8px 0',

          '&:before': {
            display: 'none'
          }
        },
        missingOppositeContent: {
          '&:before': {
            display: 'none'
          }
        }
      }
    }
  }
});
